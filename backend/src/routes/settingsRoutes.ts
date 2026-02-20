import express from 'express';
import Settings from '../models/Settings';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { generalUpload } from '../utils/fileUpload';

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

// GET /api/settings/popup — public
router.get('/popup', async (req, res) => {
    try {
        const popupEnabled = await Settings.findOne({ where: { key: 'popupEnabled' } });
        const popupTitle = await Settings.findOne({ where: { key: 'popupTitle' } });
        const popupDescription = await Settings.findOne({ where: { key: 'popupDescription' } });
        const popupCountdownText = await Settings.findOne({ where: { key: 'popupCountdownText' } });
        const popupImage = await Settings.findOne({ where: { key: 'popupImage' } });

        res.json({
            popupEnabled: popupEnabled?.value === 'true',
            popupTitle: popupTitle?.value || '',
            popupDescription: popupDescription?.value || '',
            popupCountdownText: popupCountdownText?.value || '',
            popupImage: popupImage?.value || '',
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch popup settings' });
    }
});

// PUT /api/settings/popup — admin only
router.put('/popup', authenticateToken, authorizeRole(['admin']), generalUpload.single('image'), async (req, res) => {
    try {
        const { popupEnabled, popupTitle, popupDescription, popupCountdownText, existingImage } = req.body;

        if (popupEnabled !== undefined) {
            await Settings.upsert({ key: 'popupEnabled', value: String(popupEnabled) });
        }
        if (popupTitle !== undefined) {
            await Settings.upsert({ key: 'popupTitle', value: String(popupTitle) });
        }
        if (popupDescription !== undefined) {
            await Settings.upsert({ key: 'popupDescription', value: String(popupDescription) });
        }
        if (popupCountdownText !== undefined) {
            await Settings.upsert({ key: 'popupCountdownText', value: String(popupCountdownText) });
        }

        // Image Handling
        let imageToSave = existingImage || '';

        if (req.file) {
            const files = [req.file];
            const processed = await import('../utils/fileUpload').then(m => m.processUploadedImages(files, m.UploadFolder.GENERAL));
            if (processed.length > 0) {
                imageToSave = `/uploads${processed[0].original}`; // we'll use original since thumbnails might be too small
            }
        }

        // Always replace if changing from empty to string or new image
        if (imageToSave !== undefined) {
            await Settings.upsert({ key: 'popupImage', value: String(imageToSave) });
        }

        res.json({ message: 'Popup settings updated successfully', popupImage: imageToSave });
    } catch (error) {
        console.error("Error saving popup settings", error);
        res.status(500).json({ message: 'Failed to update popup settings' });
    }
});

export default router;
