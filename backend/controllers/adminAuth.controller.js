'use strict';

const db          = require('../config/db');
const authService = require('../services/auth.service');

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalise   = raw => (raw || '').toLowerCase().trim();

const COOKIE_NAME = 'admin_rt';
const cookieOpts  = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   authService.REFRESH_TOKEN_TTL_MS,
  path:     '/',
});

exports.register = async (req, res) => {
  const { emri, mbiemri, email, password } = req.body;
  const emailNorm = normalise(email);

  if (!emri || !mbiemri || !email || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  if (!VALID_EMAIL.test(emailNorm))
    return res.status(400).json({ error: 'Please enter a valid email address.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const hash = await authService.hashPassword(password);

    const [result] = await db.query(
      `INSERT INTO Adminet (emri, mbiemri, email, fjalekalimi_hash, roli)
       VALUES (?, ?, ?, ?, 'admin')`,
      [emri.trim(), mbiemri.trim(), emailNorm, hash]
    );

    await db.query(
      `INSERT INTO UserRoles (klient_id, admin_id, rol_id)
       SELECT NULL, ?, rol_id FROM Roles WHERE emri = 'admin' LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      user: {
        id:      result.insertId,
        emri:    emri.trim(),
        mbiemri: mbiemri.trim(),
        email:   emailNorm,
        role:    'admin',
      },
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'An admin account with this email already exists.' });
    console.error('[AdminAuth] Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const emailNorm = normalise(email);

  try {
    const [rows] = await db.query('SELECT * FROM Adminet WHERE email = ?', [emailNorm]);
    const admin  = rows[0];

    if (!admin || !(await authService.comparePassword(password, admin.fjalekalimi_hash)))
      return res.status(401).json({ error: 'Incorrect email or password.' });

    const [roleRows] = await db.query(
      `SELECT r.emri FROM UserRoles ur
       JOIN Roles r ON r.rol_id = ur.rol_id
       WHERE ur.admin_id = ? LIMIT 1`,
      [admin.admin_id]
    );
    const role = roleRows[0]?.emri || 'admin';

    const token = authService.signToken({
      id:      admin.admin_id,
      email:   admin.email,
      emri:    admin.emri,
      mbiemri: admin.mbiemri,
      role,
    });

    const refreshToken  = authService.generateRefreshToken();
    const refreshExpiry = new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS);
    await db.query(
      'UPDATE Adminet SET refresh_token = ?, refresh_token_expiry = ? WHERE admin_id = ?',
      [authService.hashRefreshToken(refreshToken), refreshExpiry, admin.admin_id]
    );

    res.cookie(COOKIE_NAME, refreshToken, cookieOpts());
    return res.json({
      token,
      user: {
        id:      admin.admin_id,
        emri:    admin.emri,
        mbiemri: admin.mbiemri,
        email:   admin.email,
        role,
      },
    });

  } catch (err) {
    console.error('[AdminAuth] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

exports.me = (req, res) => {
  res.json({ admin: req.admin });
};

exports.refresh = async (req, res) => {
  const refresh_token = req.cookies?.[COOKIE_NAME];
  if (!refresh_token)
    return res.status(401).json({ error: 'Refresh token required.' });

  try {
    const [rows] = await db.query(
      `SELECT admin_id, emri, mbiemri, email, refresh_token_expiry
       FROM Adminet WHERE refresh_token = ?`,
      [authService.hashRefreshToken(refresh_token)]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Invalid refresh token.' });

    if (new Date() > new Date(rows[0].refresh_token_expiry))
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });

    const a = rows[0];
    const token = authService.signToken({
      id: a.admin_id, email: a.email,
      emri: a.emri, mbiemri: a.mbiemri, role: 'admin',
    });

    const newRefreshToken  = authService.generateRefreshToken();
    const newRefreshExpiry = new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS);
    await db.query(
      'UPDATE Adminet SET refresh_token = ?, refresh_token_expiry = ? WHERE admin_id = ?',
      [authService.hashRefreshToken(newRefreshToken), newRefreshExpiry, a.admin_id]
    );

    res.cookie(COOKIE_NAME, newRefreshToken, cookieOpts());
    return res.json({ token });
  } catch (err) {
    console.error('[AdminAuth] Refresh error:', err.message);
    return res.status(500).json({ error: 'Token refresh failed.' });
  }
};

exports.logout = async (req, res) => {
  const refresh_token = req.cookies?.[COOKIE_NAME];
  if (refresh_token) {
    await db.query(
      'UPDATE Adminet SET refresh_token = NULL, refresh_token_expiry = NULL WHERE refresh_token = ?',
      [authService.hashRefreshToken(refresh_token)]
    ).catch(() => {});
  }
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  return res.json({ message: 'Logged out successfully.' });
};

exports.forgotPassword = async (req, res) => {
  const email    = normalise(req.body.email);
  const SAFE_MSG = 'If an account with that email exists, you will receive a password reset link shortly.';

  if (!email)
    return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await db.query('SELECT admin_id FROM Adminet WHERE email = ?', [email]);

    if (rows.length) {
      const token  = authService.generateToken();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await db.query(
        'UPDATE Adminet SET reset_token = ?, reset_token_expiry = ? WHERE admin_id = ?',
        [authService.hashRefreshToken(token), expiry, rows[0].admin_id]
      );

      const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${token}`;
      // në production zëvendëso me email — mos logo token-in kurrë në prod
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ADMIN RESET] Link  : ${link}`);
        console.log(`[ADMIN RESET] Expiry: ${expiry.toISOString()}`);
      }
    }

    return res.json({ message: SAFE_MSG });

  } catch (err) {
    console.error('[AdminAuth] forgotPassword error:', err.message);
    return res.status(500).json({ error: 'Request failed. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: 'Token and new password are required.' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const [rows] = await db.query(
      'SELECT admin_id, reset_token_expiry FROM Adminet WHERE reset_token = ?',
      [authService.hashRefreshToken(token)]
    );

    if (!rows.length)
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

    if (new Date() > new Date(rows[0].reset_token_expiry))
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });

    const { admin_id } = rows[0];
    const hash = await authService.hashPassword(newPassword);

    await db.query(
      'UPDATE Adminet SET fjalekalimi_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE admin_id = ?',
      [hash, admin_id]
    );

    return res.json({ message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('[AdminAuth] resetPassword error:', err.message);
    return res.status(500).json({ error: 'Reset failed. Please try again.' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both fields are required.' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });

  try {
    const [rows] = await db.query(
      'SELECT fjalekalimi_hash FROM Adminet WHERE admin_id = ?',
      [req.admin.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Admin account not found.' });

    const { fjalekalimi_hash } = rows[0];

    if (!(await authService.comparePassword(currentPassword, fjalekalimi_hash)))
      return res.status(401).json({ error: 'Current password is incorrect.' });

    if (await authService.comparePassword(newPassword, fjalekalimi_hash))
      return res.status(400).json({ error: 'New password must be different from your current password.' });

    const newHash = await authService.hashPassword(newPassword);

    await db.query(
      'UPDATE Adminet SET fjalekalimi_hash = ? WHERE admin_id = ?',
      [newHash, req.admin.id]
    );

    return res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('[AdminAuth] changePassword error:', err.message);
    return res.status(500).json({ error: 'Password change failed. Please try again.' });
  }
};
