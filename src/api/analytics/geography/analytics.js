const express = require('express');
const router = express.Router();
const AnalyticsService = require('./analyticsService');
const { adminGuard } = require('../../common/auth/aclService');
const logger = require('../../../utils/logger');
const passport = require('passport');

const analyticsService = new AnalyticsService();
const auth = passport.authenticate('jwt', { session: false });

// Track venue interest - Public endpoint (no auth required)
router.post('/track-venue-click', async (req, res) => {
    try {
        const {
            venueId,
            venueName,
            location,
            device,
            engagement,
            userId,
            userName,
            userEmail,
            userContact,
            sessionId
        } = req.body;

        // Basic validation
        if (!venueId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'venueId and sessionId are required'
            });
        }

        const trackingData = {
            venueId,
            venueName: venueName || '',
            location: location || {},
            device: device || {},
            engagement: engagement || {},
            user: {
                userId: userId || null,
                userName: userName || '',
                userEmail: userEmail || '',
                userContact: userContact || '',
                sessionId: sessionId
            }
        };

        console.log('Received tracking data:', JSON.stringify(trackingData, null, 2));

        const result = await analyticsService.trackVenueInterest(trackingData);
        
        logger.infoLog.info(`Venue click tracked successfully: ${venueId} - ${venueName || 'Unknown venue'} by user: ${userName || 'Anonymous'}`);
        
        res.status(201).json({
            success: true,
            message: 'Venue interest tracked successfully',
            data: {
                id: result.insertedId,
                venueId: venueId,
                venueName: venueName,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.errorLog.error(`Error tracking venue click: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to track venue interest',
            details: error.message
        });
    }
});

// Update venue insights - Admin endpoint
router.post('/update-venue-insights/:venueId', auth, adminGuard, async (req, res) => {
    try {
        const { venueId } = req.params;
        
        const insights = await analyticsService.generateVenueInsights(venueId);
        
        if (!insights) {
            return res.status(404).json({
                success: false,
                error: 'No venue data found for the provided ID'
            });
        }
        
        await analyticsService.saveVenueInsights(venueId, insights);
        
        logger.infoLog.info(`Venue insights updated successfully for venue: ${venueId}`);
        
        res.status(200).json({
            success: true,
            message: 'Venue insights updated successfully',
            data: insights
        });
    } catch (error) {
        logger.errorLog.error(`Error updating venue insights: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update venue insights',
            details: error.message
        });
    }
});

// Get venue insights - Admin endpoint
router.get('/venue-insights/:venueId', auth, adminGuard, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        const insights = await analyticsService.getVenueInsights(venueId, from, to);
        
        if (!insights) {
            return res.status(404).json({
                success: false,
                error: 'No insights found for the provided venue ID'
            });
        }
        
        res.status(200).json({
            success: true,
            data: insights
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching venue insights: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venue insights',
            details: error.message
        });
    }
});

// Get venue clicks - Admin endpoint
router.get('/venue-clicks/:venueId', auth, adminGuard, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to, limit = 100, skip = 0 } = req.query;
        
        const clicks = await analyticsService.getVenueClicks(venueId, {
            from,
            to,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
        
        res.status(200).json({
            success: true,
            data: clicks
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching venue clicks: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venue clicks',
            details: error.message
        });
    }
});

// Get geographic distribution - Admin endpoint
router.get('/geographic-distribution/:venueId', auth, adminGuard, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        const distribution = await analyticsService.getGeographicDistribution(venueId, from, to);
        
        res.status(200).json({
            success: true,
            data: distribution
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching geographic distribution: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch geographic distribution',
            details: error.message
        });
    }
});

// Get aggregated stats for all venues - Admin endpoint
router.get('/stats/overview', auth, adminGuard, async (req, res) => {
    try {
        const { from, to } = req.query;
        
        const stats = await analyticsService.getOverallStats(from, to);
        
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching overview stats: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overview stats',
            details: error.message
        });
    }
});

// Get popular venues - Admin endpoint
router.get('/stats/popular-venues', auth, adminGuard, async (req, res) => {
    try {
        const { from, to, limit = 10 } = req.query;
        
        const popularVenues = await analyticsService.getPopularVenues({
            from,
            to,
            limit: parseInt(limit)
        });
        
        res.status(200).json({
            success: true,
            data: popularVenues
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching popular venues: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular venues',
            details: error.message
        });
    }
});

// Get device analytics - Admin endpoint
router.get('/stats/device-analytics', auth, adminGuard, async (req, res) => {
    try {
        const { from, to } = req.query;
        
        const deviceStats = await analyticsService.getDeviceAnalytics(from, to);
        
        res.status(200).json({
            success: true,
            data: deviceStats
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching device analytics: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch device analytics',
            details: error.message
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Analytics Geography API is healthy',
        timestamp: new Date()
    });
});

module.exports = router;
