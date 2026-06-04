'use strict';

const db          = require('../config/db');
const authService = require('../services/auth.service');

const UBT_DOMAIN = '@ubt-uni.net';
const isUBT      = email => typeof email === 'string' && email.toLowerCase().endsWith(UBT_DOMAIN);
const normalise  = raw   => (raw || '').toLowerCase().trim();

const COOKIE_NAME = 'user_rt';
const cookieOpts  = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   authService.REFRESH_TOKEN_TTL_MS,
  path:     '/',
});

exports.register = async (req, res) => {
  const { emri, mbiemri, email, password, telefoni, adresa, qyteti, kodi_postar } = req.body;
  const emailNorm = normalise(email);

  if (!emri || !mbiemri || !email || !password)
    return res.status(400).json({ error: 'Please fill in all required fields.' });

  if (!isUBT(emailNorm))
    return res.status(403).json({ error: 'Only @ubt-uni.net email addresses are allowed to register.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const hash = await authService.hashPassword(password);

    const [result] = await db.query(
      `INSERT INTO Klientet
         (emri, mbiemri, email, fjalekalimi_hash, telefoni, adresa, qyteti, kodi_postar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [emri.trim(), mbiemri.trim(), emailNorm, hash,
       telefoni || null, adresa || null, qyteti || null, kodi_postar || null]
    );

    await db.query(
      `INSERT INTO UserRoles (klient_id, admin_id, rol_id)
       SELECT ?, NULL, rol_id FROM Roles WHERE emri = 'user' LIMIT 1`,
      [result.insertId]
    );

    const token = authService.signToken({
      id: result.insertId, email: emailNorm,
      emri: emri.trim(), mbiemri: mbiemri.trim(), role: 'user',
    });

    const refreshToken  = authService.generateRefreshToken();
    const refreshExpiry = new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS);
    await db.query(
      'UPDATE Klientet SET refresh_token = ?, refresh_token_expiry = ? WHERE klient_id = ?',
      [authService.hashRefreshToken(refreshToken), refreshExpiry, result.insertId]
    );

    res.cookie(COOKIE_NAME, refreshToken, cookieOpts());
    return res.status(201).json({
      token,
      user: { id: result.insertId, emri: emri.trim(), mbiemri: mbiemri.trim(), email: emailNorm, role: 'user' },
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'An account with this email already exists.' });
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const emailNorm = normalise(email);

  try {
    const [rows] = await db.query('SELECT * FROM Klientet WHERE email = ?', [emailNorm]);
    const user   = rows[0];

    if (!user || !(await authService.comparePassword(password, user.fjalekalimi_hash)))
      return res.status(401).json({ error: 'Incorrect email or password.' });

    const [roleRows] = await db.query(
      `SELECT r.emri FROM UserRoles ur
       JOIN Roles r ON r.rol_id = ur.rol_id
       WHERE ur.klient_id = ? LIMIT 1`,
      [user.klient_id]
    );
    const role = roleRows[0]?.emri || 'user';

    const token = authService.signToken({
      id: user.klient_id, email: user.email,
      emri: user.emri, mbiemri: user.mbiemri, role,
    });

    const refreshToken  = authService.generateRefreshToken();
    const refreshExpiry = new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS);
    await db.query(
      'UPDATE Klientet SET refresh_token = ?, refresh_token_expiry = ? WHERE klient_id = ?',
      [authService.hashRefreshToken(refreshToken), refreshExpiry, user.klient_id]
    );

    res.cookie(COOKIE_NAME, refreshToken, cookieOpts());
    return res.json({
      token,
      user: { id: user.klient_id, emri: user.emri, mbiemri: user.mbiemri, email: user.email, role },
    });

  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

exports.forgotPassword = async (req, res) => {
  const email    = normalise(req.body.email);
  const SAFE_MSG = 'If an account with that email exists, you will receive a password reset link shortly.';

  if (!email)
    return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await db.query('SELECT klient_id FROM Klientet WHERE email = ?', [email]);

    if (rows.length) {
      const token  = authService.generateToken();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await db.query(
        'UPDATE Klientet SET reset_token = ?, reset_token_expiry = ? WHERE klient_id = ?',
        [authService.hashRefreshToken(token), expiry, rows[0].klient_id]
      );

      const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
      // në production zëvendëso me email — mos logo token-in kurrë në prod
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[USER RESET] Link  : ${link}`);
        console.log(`[USER RESET] Expiry: ${expiry.toISOString()}`);
      }
    }

    return res.json({ message: SAFE_MSG });

  } catch (err) {
    console.error('[Auth] forgotPassword error:', err.message);
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
      'SELECT klient_id, reset_token_expiry FROM Klientet WHERE reset_token = ?',
      [authService.hashRefreshToken(token)]
    );

    if (!rows.length)
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });

    if (new Date() > new Date(rows[0].reset_token_expiry))
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });

    const hash = await authService.hashPassword(newPassword);

    await db.query(
      'UPDATE Klientet SET fjalekalimi_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE klient_id = ?',
      [hash, rows[0].klient_id]
    );

    return res.json({ message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('[Auth] resetPassword error:', err.message);
    return res.status(500).json({ error: 'Reset failed. Please try again.' });
  }
};

exports.refresh = async (req, res) => {
  const refresh_token = req.cookies?.[COOKIE_NAME];
  if (!refresh_token)
    return res.status(401).json({ error: 'Refresh token required.' });

  try {
    const [rows] = await db.query(
      `SELECT klient_id, emri, mbiemri, email, refresh_token_expiry
       FROM Klientet WHERE refresh_token = ?`,
      [authService.hashRefreshToken(refresh_token)]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Invalid refresh token.' });

    if (new Date() > new Date(rows[0].refresh_token_expiry))
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });

    const k = rows[0];
    const token = authService.signToken({
      id: k.klient_id, email: k.email,
      emri: k.emri, mbiemri: k.mbiemri, role: 'user',
    });

    const newRefreshToken  = authService.generateRefreshToken();
    const newRefreshExpiry = new Date(Date.now() + authService.REFRESH_TOKEN_TTL_MS);
    await db.query(
      'UPDATE Klientet SET refresh_token = ?, refresh_token_expiry = ? WHERE klient_id = ?',
      [authService.hashRefreshToken(newRefreshToken), newRefreshExpiry, k.klient_id]
    );

    res.cookie(COOKIE_NAME, newRefreshToken, cookieOpts());
    return res.json({ token });
  } catch (err) {
    console.error('[Auth] Refresh error:', err.message);
    return res.status(500).json({ error: 'Token refresh failed.' });
  }
};

exports.logout = async (req, res) => {
  const refresh_token = req.cookies?.[COOKIE_NAME];
  if (refresh_token) {
    await db.query(
      'UPDATE Klientet SET refresh_token = NULL, refresh_token_expiry = NULL WHERE refresh_token = ?',
      [authService.hashRefreshToken(refresh_token)]
    ).catch(() => {});
  }
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  return res.json({ message: 'Logged out successfully.' });
};

exports.me = (req, res) => res.json({ user: req.user });
