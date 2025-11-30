import { Router } from 'express';
import securityGuildService from '../services/securityGuildService';

const router = Router();

router.post('/join', async (req, res) => {
  const { user_id, username } = req.body;
  const row = await securityGuildService.joinGuild(user_id, username);
  res.json(row);
});

router.get('/contracts', async (req, res) => {
  const status = (req.query.status as string) || 'open';
  const rows = await securityGuildService.listContracts(status);
  res.json(rows);
});

router.post('/contracts', async (req, res) => {
  const created = await securityGuildService.createContract(req.body);
  res.json(created);
});

router.post('/contracts/:contract_id/assign', async (req, res) => {
  const updated = await securityGuildService.assignContract(req.params.contract_id, req.body.user_id);
  res.json(updated);
});

router.post('/contracts/:contract_id/complete', async (req, res) => {
  const updated = await securityGuildService.completeContract(req.params.contract_id);
  res.json(updated);
});

export default router;
