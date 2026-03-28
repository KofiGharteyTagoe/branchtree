import { Router } from 'express';
import * as settings from '../models/settings.model.js';
import * as userModel from '../models/user.model.js';
import { createJwt, setSessionCookie } from './auth.routes.js';
import { isValidEmail, isStrongPassword } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export const setupRouter = Router();

// GET /api/setup/status — Check if initial setup is needed
setupRouter.get('/setup/status', (_req, res) => {
  res.json({
    setupComplete: settings.isSetupComplete(),
  });
});

// POST /api/setup — Create the initial admin account
setupRouter.post('/setup', (req, res) => {
  // Block if setup is already complete
  if (settings.isSetupComplete()) {
    return res.status(403).json({ error: 'Setup has already been completed' });
  }

  const { setupToken, email, password, displayName } = req.body;

  // Validate setup token
  if (!setupToken || typeof setupToken !== 'string') {
    return res.status(400).json({ error: 'Setup token is required' });
  }

  const storedToken = settings.getSetting('setup_token');
  if (!storedToken || setupToken !== storedToken) {
    return res.status(401).json({ error: 'Invalid setup token' });
  }

  // Validate email and password
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }
  const passwordCheck = isStrongPassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.reason });
  }

  try {
    // Create admin user
    const user = userModel.createLocalAdmin(email, password, displayName);

    // Mark setup as complete and delete the setup token
    settings.setSetting('setup_complete', 'true');
    settings.deleteSetting('setup_token');

    // Issue JWT for the new admin via httpOnly cookie
    const token = createJwt(user.id, user.email);
    setSessionCookie(res, token);

    res.status(201).json({
      message: 'Admin account created successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isAdmin: true,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Setup error');
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

// POST /api/auth/login — Local admin login (email/password)
setupRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = userModel.verifyLocalPassword(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createJwt(user.id, user.email);
  setSessionCookie(res, token);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      isAdmin: user.is_admin === 1,
    },
  });
});
