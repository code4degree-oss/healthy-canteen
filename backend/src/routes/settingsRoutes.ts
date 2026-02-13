import express from 'express';
import Settings from '../models/Settings';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/settings/service-area — public (customers need this to show the circle)
router.get('/service-area', async (req, res) => {
    try {
        const outletLat = await Settings.findOne({ where: { key: 'outletLat' } });
        const outletLng = await Settings.findOne({ where: { key: 'outletLng' } });
        const radiusKm = await Settings.findOne({ where: { key: 'serviceRadiusKm' } });

        res.json({
            outletLat: parseFloat(outletLat?.value || '18.654949627383616'),
            outletLng: parseFloat(outletLng?.value || '73.84475261136429'),
            serviceRadiusKm: parseFloat(radiusKm?.value || '5'),
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch service area settings' });
    }
});

// PUT /api/settings/service-area — admin only
router.put('/service-area', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { outletLat, outletLng, serviceRadiusKm } = req.body;

        if (outletLat !== undefined) {
            await Settings.upsert({ key: 'outletLat', value: String(outletLat) });
        }
        if (outletLng !== undefined) {
            await Settings.upsert({ key: 'outletLng', value: String(outletLng) });
        }
        if (serviceRadiusKm !== undefined) {
            await Settings.upsert({ key: 'serviceRadiusKm', value: String(serviceRadiusKm) });
        }

        res.json({ message: 'Service area updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update service area settings' });
    }
});

export default router;
