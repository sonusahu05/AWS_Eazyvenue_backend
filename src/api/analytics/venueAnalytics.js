const express = require('express');
const router = express.Router();
const venueAnalyticsService = require('./venueAnalyticsService');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });

/**
 * Get hot dates analytics - which dates are trending for bookings
 * Query params: from, to, limit
 * For admin: GET /api/analytics/hot-dates
 * For venue: GET /api/analytics/hot-dates/:venueId
 */
router.get('/hot-dates/:venueId?', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to, limit = 50 } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.getHotDatesAnalytics({
            venueId: actualVenueId,
            from,
            to,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            message: 'Hot dates analytics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting hot dates analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get hot dates analytics',
            error: error.message
        });
    }
});

/**
 * Get engagement funnel analytics
 * Query params: from, to
 */
router.get('/engagement-funnel/:venueId?', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.getEngagementFunnelAnalytics({
            venueId: actualVenueId,
            from,
            to
        });

        res.json({
            success: true,
            message: 'Engagement funnel analytics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting engagement funnel analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engagement funnel analytics',
            error: error.message
        });
    }
});

/**
 * Get leads analytics with engagement data
 * Query params: from, to, leadStatus, limit, skip
 */
router.get('/leads/:venueId?', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to, leadStatus, limit = 50, skip = 0 } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.getLeadsAnalytics({
            venueId: actualVenueId,
            from,
            to,
            leadStatus,
            limit: parseInt(limit),
            skip: parseInt(skip),
            userRole: req.user.role
        });

        res.json({
            success: true,
            message: 'Leads analytics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting leads analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leads analytics',
            error: error.message
        });
    }
});

/**
 * Get popular dates analytics
 * Query params: from, to, occasion
 */
router.get('/popular-dates/:venueId?', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to, occasion } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.getPopularDatesAnalytics({
            venueId: actualVenueId,
            from,
            to,
            occasion
        });

        res.json({
            success: true,
            message: 'Popular dates analytics retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting popular dates analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get popular dates analytics',
            error: error.message
        });
    }
});

/**
 * Get comprehensive venue insights dashboard
 * Query params: from, to
 */
router.get('/venue-insights-dashboard/:venueId', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }
        
        const result = await venueAnalyticsService.getVenueInsightsDashboard({
            venueId,
            from,
            to,
            userRole: req.user.role
        });

        res.json({
            success: true,
            message: 'Venue insights dashboard retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting venue insights dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get venue insights dashboard',
            error: error.message
        });
    }
});

/**
 * Get user engagement timeline for a specific lead
 * Query params: venueId
 */
router.get('/user-timeline/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { venueId } = req.query;
        
        // Check permissions - venue owners can only see their venue data
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only view your own venue analytics'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.getUserEngagementTimeline({
            userId,
            venueId: actualVenueId
        });

        res.json({
            success: true,
            message: 'User engagement timeline retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error getting user timeline:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user timeline',
            error: error.message
        });
    }
});

/**
 * Export analytics data
 * Query params: format (csv/xlsx), from, to, and type-specific params
 */
router.get('/export/:type/:venueId?', auth, async (req, res) => {
    try {
        const { type, venueId } = req.params;
        const { format = 'xlsx', ...queryParams } = req.query;
        
        // Check permissions
        if (req.user.role === 'venue_owner' && venueId && venueId !== req.user.venueId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - can only export your own venue data'
            });
        }

        const actualVenueId = req.user.role === 'venue_owner' ? req.user.venueId : venueId;
        
        const result = await venueAnalyticsService.exportAnalyticsData({
            type,
            venueId: actualVenueId,
            format,
            userRole: req.user.role,
            ...queryParams
        });

        // Set appropriate headers for file download
        res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics-${actualVenueId || 'all'}-${new Date().toISOString().split('T')[0]}.${format}"`);
        
        res.send(result);
    } catch (error) {
        console.error('Error exporting analytics data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export analytics data',
            error: error.message
        });
    }
});

module.exports = router;
