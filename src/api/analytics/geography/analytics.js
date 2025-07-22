const express = require('express');
const router = express.Router();
const AnalyticsService = require('./analyticsService');
const { adminGuard } = require('../../common/auth/aclService');
const logger = require('../../../utils/logger');
const passport = require('passport');

const analyticsService = new AnalyticsService();
const auth = passport.authenticate('jwt', { session: false });

/**
 * Helper function to get user's full name for venue filtering
 */
function getUserFullName(user) {
    if (!user) return null;
    
    // Check for direct name field first
    const directName = user.name || user.userdata?.name;
    if (directName && directName.trim()) {
        return directName.trim();
    }
    
    // Construct from firstname + lastname
    const firstname = user.firstname || user.userdata?.firstname || '';
    const lastname = user.lastname || user.userdata?.lastname || '';
    const fullName = `${firstname} ${lastname}`.trim();
    
    console.log('👤 USER NAME CONSTRUCTION:', {
        directName,
        firstname,
        lastname,
        fullName,
        finalResult: fullName || directName || null
    });
    
    return fullName || null;
}

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

              // Enhanced engagement validation and sanitization
        const sanitizedEngagement = {
            timeSpentSeconds: engagement?.timeSpentSeconds || 0,
            scrollDepthPercent: Math.min(engagement?.scrollDepthPercent || 0, 100),
            submittedEnquiry: engagement?.submittedEnquiry || false,
            qualityScore: Math.min(engagement?.qualityScore || 0, 1),
            // NEW: Enhanced actions tracking
            actions: engagement?.actions ? {
                startFilterDate: engagement.actions.startFilterDate || null,
                endFilterDate: engagement.actions.endFilterDate || null,
                eventDuration: engagement.actions.eventDuration || null,
                occasion: engagement.actions.occasion || null,
                sendEnquiryClicked: Boolean(engagement.actions.sendEnquiryClicked),
                weddingDecorType: engagement.actions.weddingDecorType || null,
                weddingDecorPrice: typeof engagement.actions.weddingDecorPrice === 'number' ? 
                    Math.round(engagement.actions.weddingDecorPrice) : null,
                foodMenuType: engagement.actions.foodMenuType || null,
                foodMenuPrice: typeof engagement.actions.foodMenuPrice === 'number' ? 
                    Math.round(engagement.actions.foodMenuPrice) : null,
                foodMenuPlate: engagement.actions.foodMenuPlate || null,
                guestCount: engagement.actions.guestCount || null,
                clickedOnReserved: Boolean(engagement.actions.clickedOnReserved),
                clickedOnBookNow: Boolean(engagement.actions.clickedOnBookNow),
                madePayment: Boolean(engagement.actions.madePayment)
            } : {
                startFilterDate: null,
                endFilterDate: null,
                eventDuration: null,
                occasion: null,
                sendEnquiryClicked: false,
                weddingDecorType: null,
                weddingDecorPrice: null,
                foodMenuType: null,
                foodMenuPrice: null,
                foodMenuPlate: null,
                guestCount: null,
                clickedOnReserved: false,
                clickedOnBookNow: false,
                madePayment: false
            }
        };

        const trackingData = {
            venueId,
            venueName: venueName || '',
            location: location || {},
            device: device || {},
            engagement: sanitizedEngagement,
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

// Get funnel analytics for a venue - Admin endpoint
router.get('/stats/funnel/:venueId', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        const dateRange = {};
        if (from) dateRange.start = from;
        if (to) dateRange.end = to;
        
        const funnelData = await analyticsService.getFunnelAnalytics(venueId, dateRange);
        
        res.status(200).json({
            success: true,
            data: funnelData
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching funnel analytics: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch funnel analytics',
            details: error.message
        });
    }
});

// Get action analytics for a venue - Admin endpoint
router.get('/stats/actions/:venueId', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        
        const dateRange = {};
        if (from) dateRange.start = from;
        if (to) dateRange.end = to;
        
        const actionData = await analyticsService.getActionAnalytics(venueId, dateRange);
        
        res.status(200).json({
            success: true,
            data: actionData
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching action analytics: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch action analytics',
            details: error.message
        });
    }
});

// Update venue insights - Admin endpoint
router.post('/update-venue-insights/:venueId', auth,  async (req, res) => {
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
router.get('/venue-insights/:venueId', auth,  async (req, res) => {
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
router.get('/venue-clicks/:venueId', auth,  async (req, res) => {
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

// NEW: Get all venue clicks - Admin endpoint (for all venues analytics)
router.get('/venue-clicks', auth, async (req, res) => {
    try {
        const { from, to, limit = 100, skip = 0 } = req.query;
        
        console.log('📊 Getting all venue clicks:', { from, to, limit, skip });
        
        const clicks = await analyticsService.getAllVenueClicks({
            from,
            to,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
        
        console.log('📊 All venue clicks response:', clicks?.length || 0, 'records');
        
        res.status(200).json({
            success: true,
            data: clicks
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching all venue clicks: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch all venue clicks',
            details: error.message
        });
    }
});

// NEW: Get aggregated venue clicks - Admin endpoint (for aggregated analytics)
router.get('/venue-clicks-aggregated/:venueId', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to, groupBy = 'date' } = req.query;
        
        console.log('📊 Getting aggregated venue clicks for venue:', venueId, { from, to, groupBy });
        
        const aggregatedData = await analyticsService.getVenueClicksAggregated(venueId, {
            from,
            to,
            groupBy
        });
        
        console.log('📊 Aggregated venue clicks response:', aggregatedData?.length || 0, 'groups');
        
        res.status(200).json({
            success: true,
            data: aggregatedData
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching aggregated venue clicks: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch aggregated venue clicks',
            details: error.message
        });
    }
});

// NEW: Get aggregated all venue clicks - Admin endpoint (for all venues aggregated analytics)
router.get('/venue-clicks-aggregated', auth, async (req, res) => {
    try {
        const { from, to, groupBy = 'date' } = req.query;
        
        console.log('📊 Getting aggregated all venue clicks:', { from, to, groupBy });
        
        const aggregatedData = await analyticsService.getAllVenueClicksAggregated({
            from,
            to,
            groupBy
        });
        
        console.log('📊 Aggregated all venue clicks response:', aggregatedData?.length || 0, 'groups');
        
        res.status(200).json({
            success: true,
            data: aggregatedData
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching aggregated all venue clicks: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch aggregated all venue clicks',
            details: error.message
        });
    }
});

// Get geographic distribution - Admin endpoint
router.get('/geographic-distribution/:venueId', auth,  async (req, res) => {
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

// Get aggregated stats for all venues - Admin endpoint or venue-specific for venue owners
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const { from, to, venueFilter } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 OVERVIEW STATS - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            frontendVenueFilter: venueFilter
        });
        
        let finalVenueFilter = venueFilter; // Use frontend-provided filter first
        
        // If no frontend filter provided and user is not admin, filter by their venue name
        if (!finalVenueFilter && !isAdmin && userFullName) {
            finalVenueFilter = userFullName;
            console.log('📊 OVERVIEW STATS - Applied auto venue filter:', finalVenueFilter);
        }
        
        const stats = await analyticsService.getOverallStats(from, to, finalVenueFilter);
        
        res.status(200).json({
            success: true,
            data: stats,
            isFiltered: finalVenueFilter !== null
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

// Get popular venues - Admin endpoint or venue-specific for venue owners
router.get('/stats/popular-venues', auth, async (req, res) => {
    try {
        const { from, to, limit = 10, venueFilter } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 POPULAR VENUES - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            frontendVenueFilter: venueFilter,
            fullUserObject: req.user
        });
        
        let finalVenueFilter = venueFilter; // Use frontend-provided filter first
        
        // If no frontend filter provided and user is not admin, filter by their venue name
        if (!finalVenueFilter && !isAdmin && userFullName) {
            finalVenueFilter = userFullName;
            console.log('📊 POPULAR VENUES - Applied auto venue filter:', finalVenueFilter);
        }
        
        const popularVenues = await analyticsService.getPopularVenues({
            from,
            to,
            limit: parseInt(limit),
            venueFilter: finalVenueFilter
        });
        
        res.status(200).json({
            success: true,
            data: popularVenues,
            isFiltered: finalVenueFilter !== null
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

// Get device analytics - Admin endpoint or venue-specific for venue owners
router.get('/stats/device-analytics', auth, async (req, res) => {
    try {
        const { from, to, venueFilter } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 DEVICE ANALYTICS - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            frontendVenueFilter: venueFilter
        });
        
        let finalVenueFilter = venueFilter; // Use frontend-provided filter first
        
        // If no frontend filter provided and user is not admin, filter by their venue name
        if (!finalVenueFilter && !isAdmin && userFullName) {
            finalVenueFilter = userFullName;
            console.log('📊 DEVICE ANALYTICS - Applied auto venue filter:', finalVenueFilter);
        }
        
        const deviceStats = await analyticsService.getDeviceAnalytics(from, to, finalVenueFilter);
        
        res.status(200).json({
            success: true,
            data: deviceStats,
            isFiltered: finalVenueFilter !== null
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

// Get timeline analytics - New endpoint for click timeline chart
router.get('/stats/timeline', auth, async (req, res) => {
    try {
        const { from, to, venueFilter } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 TIMELINE ANALYTICS - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            frontendVenueFilter: venueFilter
        });
        
        let finalVenueFilter = venueFilter; // Use frontend-provided filter first
        
        // If no frontend filter provided and user is not admin, filter by their venue name
        if (!finalVenueFilter && !isAdmin && userFullName) {
            finalVenueFilter = userFullName;
            console.log('📊 TIMELINE ANALYTICS - Applied auto venue filter:', finalVenueFilter);
        }
        
        const timelineData = await analyticsService.getTimelineAnalytics(from, to, finalVenueFilter);
        
        res.status(200).json({
            success: true,
            data: timelineData,
            isFiltered: finalVenueFilter !== null
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching timeline analytics: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timeline analytics',
            details: error.message
        });
    }
});

// Get top subareas - New endpoint for subareas analytics
router.get('/stats/top-subareas', auth, async (req, res) => {
    try {
        const { from, to, limit = 10, venueFilter } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 TOP SUBAREAS - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            frontendVenueFilter: venueFilter
        });
        
        let finalVenueFilter = venueFilter; // Use frontend-provided filter first
        
        // If no frontend filter provided and user is not admin, filter by their venue name
        if (!finalVenueFilter && !isAdmin && userFullName) {
            finalVenueFilter = userFullName;
            console.log('📊 TOP SUBAREAS - Applied auto venue filter:', finalVenueFilter);
        }
        
        const topSubareas = await analyticsService.getTopSubareas(from, to, finalVenueFilter, parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: topSubareas,
            isFiltered: finalVenueFilter !== null
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching top subareas: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top subareas',
            details: error.message
        });
    }
});

// Get user click details for a venue - Admin gets full info, venue owners get limited info
router.get('/stats/user-clicks/:venueId', auth, async (req, res) => {
    try {
        console.log('=== /stats/user-clicks/:venueId API Endpoint ===');
        const { venueId } = req.params;
        const { from, to } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('Request parameters:');
        console.log('- venueId:', venueId);
        console.log('- from:', from);
        console.log('- to:', to);
        console.log('- userRole:', userRole);
        console.log('- userRoleName:', userRoleName);
        console.log('- isAdmin:', isAdmin);
        console.log('- userFullName:', userFullName);
        
        // Check if user has access to this venue data
        // For now, allow all authenticated users to view user click details
        // TODO: Implement proper venue ownership check
        if (!isAdmin) {
            console.log('Non-admin user accessing venue data - venue owner check needed');
            // We could implement venue ownership check here later
            // For now, we'll allow access but limit user info based on role
        }
        
        console.log('Access granted');
        
        // Include user contact info for all authenticated users
        const includeUserInfo = true; // Changed from: isAdmin
        console.log('includeUserInfo:', includeUserInfo);
        
        const userClicks = await analyticsService.getUserClickDetails(venueId, from, to, true);
        
        console.log('API response data:', {
            resultType: Array.isArray(userClicks) ? 'array' : typeof userClicks,
            resultLength: Array.isArray(userClicks) ? userClicks.length : 'N/A'
        });
        
        res.status(200).json({
            success: true,
            data: userClicks,
            includesUserInfo: includeUserInfo
        });
    } catch (error) {
        console.error('Error in /stats/user-clicks/:venueId:', error);
        logger.errorLog.error(`Error fetching user clicks: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user clicks',
            details: error.message
        });
    }
});

// Get venue-specific timeline analytics
router.get('/stats/venue-timeline/:venueId', auth, async (req, res) => {
    try {
        const { venueId } = req.params;
        const { from, to } = req.query;
        const userRole = req.user?.role || req.user?.userdata?.role;
        const userRoleName = req.user?.rolename || req.user?.userdata?.rolename;
        const userFullName = getUserFullName(req.user);
        
        // Check if user is admin - check both role and rolename fields
        const isAdmin = userRole === 'admin' || userRoleName === 'admin';
        
        console.log('📊 VENUE TIMELINE - User info:', {
            userRole,
            userRoleName,
            isAdmin,
            userFullName,
            venueId
        });
        
        // Check if user has access to this venue data
        // For now, allow all authenticated users to view venue timeline data
        // TODO: Implement proper venue ownership check
        // if (!isAdmin) {
        //     console.log('Non-admin user accessing venue timeline data - venue owner check needed');
        //     // We could implement venue ownership check here later
        // }
        
        const timelineData = await analyticsService.getVenueTimelineAnalytics(venueId, from, to);
        
        res.status(200).json({
            success: true,
            data: timelineData
        });
    } catch (error) {
        logger.errorLog.error(`Error fetching venue timeline: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venue timeline analytics',
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
