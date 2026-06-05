'use strict';

const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl      = require('../controllers/adminAuth.controller');
const adminAuth = require('../middleware/adminAuth');

const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const refreshLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many refresh attempts. Please try again later.' },
});

const forgotLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many password reset requests. Please try again in 1 hour.' },
});

router.post('/register',                       ctrl.register);
router.post('/login',           loginLimiter,  ctrl.login);
router.get ('/me',              adminAuth,     ctrl.me);
router.put ('/change-password', adminAuth,     ctrl.changePassword);
router.post('/forgot-password', forgotLimiter, ctrl.forgotPassword);
router.put ('/reset-password',                 ctrl.resetPassword);
router.post('/refresh',         refreshLimiter, ctrl.refresh);
router.post('/logout',                          ctrl.logout);

module.exports = router;
