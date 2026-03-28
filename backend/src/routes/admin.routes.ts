import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as settings from '../models/settings.model.js';
import * as userModel from '../models/user.model.js';
import * as feedbackModel from '../models/feedback.model.js';
import { authenticate } from '../middleware/auth.js';

export const adminRouter = Router();

/**
 * Middleware that checks if the authenticated user is an admin.
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user = userModel.getUserById(req.user.userId);
  if (!user || user.is_admin !== 1) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// All admin routes require auth + admin role
adminRouter.use('/admin', authenticate, requireAdmin);

// GET /api/admin/settings — List all settings
adminRouter.get('/admin/settings', (_req, res) => {
  const allSettings = settings.getAllSettings();
  res.json({ settings: allSettings });
});

// PUT /api/admin/settings — Update one or more settings
adminRouter.put('/admin/settings', (req, res) => {
  const { updates } = req.body;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Request body must contain an "updates" object' });
  }

  // Protect auto-generated secrets from being set to empty
  const protectedKeys = ['jwt_secret', 'encryption_key'];
  for (const key of protectedKeys) {
    if (key in updates && (!updates[key] || typeof updates[key] !== 'string' || updates[key].length < 32)) {
      return res.status(400).json({ error: `${key} must be at least 32 characters` });
    }
  }

  // Determine which keys are secrets
  const secretKeys = new Set([
    'jwt_secret', 'encryption_key',
    'google_client_secret', 'microsoft_client_secret',
    'setup_token',
  ]);

  // Prevent modifying setup_complete or setup_token via this endpoint
  const readonlyKeys = new Set(['setup_complete', 'setup_token']);

  const applied: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (readonlyKeys.has(key)) continue;
    if (typeof value !== 'string') continue;

    settings.setSetting(key, value, secretKeys.has(key));
    applied.push(key);
  }

  res.json({ message: `Updated ${applied.length} setting(s)`, applied });
});

// DELETE /api/admin/settings/:key — Delete a setting
adminRouter.delete('/admin/settings/:key', (req, res) => {
  const { key } = req.params;

  // Prevent deleting critical settings
  const criticalKeys = new Set(['jwt_secret', 'encryption_key', 'setup_complete']);
  if (criticalKeys.has(key)) {
    return res.status(400).json({ error: `Cannot delete critical setting: ${key}` });
  }

  settings.deleteSetting(key);
  res.json({ message: `Setting '${key}' deleted` });
});

// POST /api/admin/change-password — Change admin password
adminRouter.post('/admin/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 12) {
    return res.status(400).json({ error: 'New password must be at least 12 characters' });
  }

  const user = userModel.getUserById(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const verified = userModel.verifyLocalPassword(user.email, currentPassword);
  if (!verified) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  userModel.changePassword(user.id, newPassword);
  res.json({ message: 'Password changed successfully' });
});

// ─── User Management ────────────────────────────────────────────────────────

// GET /api/admin/users — List all users with metadata
adminRouter.get('/admin/users', (_req, res) => {
  const users = userModel.getAllUsersWithMeta();
  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      oauthProvider: u.oauth_provider,
      isAdmin: u.is_admin === 1,
      isRestricted: u.is_restricted === 1,
      restrictionReason: u.restriction_reason,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      appCount: u.app_count,
      branchCount: u.branch_count,
      commitCount: u.commit_count,
    })),
  });
});

// POST /api/admin/users/:userId/restrict — Restrict a user
adminRouter.post('/admin/users/:userId/restrict', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'A restriction reason is required' });
  }

  const target = userModel.getUserById(userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (target.is_admin === 1) {
    return res.status(400).json({ error: 'Cannot restrict an admin user' });
  }

  userModel.restrictUser(userId, reason);
  res.json({ message: `User ${target.email} has been restricted` });
});

// POST /api/admin/users/:userId/unrestrict — Remove restriction from a user
adminRouter.post('/admin/users/:userId/unrestrict', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);

  const target = userModel.getUserById(userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }

  userModel.unrestrictUser(userId);
  res.json({ message: `Restriction removed from ${target.email}` });
});

// DELETE /api/admin/users/:userId — Delete a user
adminRouter.delete('/admin/users/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId, 10);

  const target = userModel.getUserById(userId);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (target.is_admin === 1) {
    return res.status(400).json({ error: 'Cannot delete an admin user' });
  }
  if (userId === req.user!.userId) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  userModel.deleteUser(userId);
  res.json({ message: `User ${target.email} has been deleted` });
});

// ─── Feedback Management ────────────────────────────────────────────────────

// GET /api/admin/feedback — List all feedback
adminRouter.get('/admin/feedback', (_req, res) => {
  const feedback = feedbackModel.getAllFeedback();
  res.json({ feedback });
});

// PUT /api/admin/feedback/:feedbackId — Update feedback status/notes
adminRouter.put('/admin/feedback/:feedbackId', (req: Request, res: Response) => {
  const feedbackId = parseInt(req.params.feedbackId, 10);
  const { status, adminNotes } = req.body;

  const validStatuses = ['open', 'in_progress', 'resolved', 'dismissed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = feedbackModel.updateFeedback(feedbackId, status, adminNotes);
  if (!updated) {
    return res.status(404).json({ error: 'Feedback not found' });
  }

  res.json({ feedback: updated });
});

// DELETE /api/admin/feedback/:feedbackId — Delete feedback
adminRouter.delete('/admin/feedback/:feedbackId', (req: Request, res: Response) => {
  const feedbackId = parseInt(req.params.feedbackId, 10);
  feedbackModel.deleteFeedback(feedbackId);
  res.json({ message: 'Feedback deleted' });
});
