import { Router } from 'express';

const router = Router();

// Health check endpoint for UptimeRobot to prevent Render free-tier from sleeping
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'active', timestamp: new Date() });
});

export default router;
