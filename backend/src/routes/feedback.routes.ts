import { Router } from 'express';
import type { Request, Response } from 'express';
import * as feedbackModel from '../models/feedback.model.js';

export const feedbackRouter = Router();

const VALID_CATEGORIES = ['bug', 'improvement', 'feature', 'general'];

// POST /api/feedback — Submit feedback
feedbackRouter.post('/feedback', (req: Request, res: Response) => {
  const { category, title, description } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: 'Description is required' });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const feedback = feedbackModel.createFeedback(
    req.user!.userId,
    category || 'general',
    title.trim(),
    description.trim()
  );

  res.status(201).json({ feedback });
});

// GET /api/feedback — Get current user's feedback
feedbackRouter.get('/feedback', (req: Request, res: Response) => {
  const feedback = feedbackModel.getFeedbackByUser(req.user!.userId);
  res.json({ feedback });
});
