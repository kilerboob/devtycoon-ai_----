import { Router } from 'express';
import securityService from '../services/securityService';

const router = Router();

router.get('/events', async (req, res) => {
  const events = await securityService.listSecurityEvents(Number(req.query.limit) || 50);
  res.json(events);
});

router.post('/events', async (req, res) => {
  const saved = await securityService.logSecurityEvent(req.body);
  res.json(saved);
});

router.post('/intrusions', async (req, res) => {
  const created = await securityService.createIntrusion(req.body);
  res.json(created);
});

router.patch('/intrusions/:id/status', async (req, res) => {
  const updated = await securityService.updateIntrusionStatus(Number(req.params.id), req.body.status, req.body.resolved_at);
  res.json(updated);
});

export default router;
