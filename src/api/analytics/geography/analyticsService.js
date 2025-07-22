const VenueClickRepository = require('./venueClickRepository');
const VenueInsightRepository = require('./venueInsightRepository');
const BaseRepository = require('../../../db/baseRepository');

class AnalyticsService {
    constructor() {
        this.venueClickRepository = new VenueClickRepository();
        this.venueInsightRepository = new VenueInsightRepository();
        this.baseRepository = new BaseRepository();
    }

    async getVenueNameFromDatabase(venueId) {
        try {
            const { ObjectId } = require('mongodb');
            const venueObjectId = typeof venueId === 'string' ? new ObjectId(venueId) : venueId;
            
            const venue = await this.baseRepository.dbClient
                .then(db => db
                    .collection('venues')
                    .findOne({ _id: venueObjectId }, { projection: { name: 1 } }));
            
            return venue;
        } catch (error) {
            console.warn(`Error fetching venue name for ${venueId}:`, error.message);
            return null;
        }
    }

    calculateQualityScore(engagementData) {
        const { 
            timeSpentSeconds = 0, 
            scrollDepthPercent = 0, 
            submittedEnquiry = false,
            actions = {}
        } = engagementData;
        
        // Enhanced weighted scoring algorithm with actions
        const timeWeight = 0.25;
        const scrollWeight = 0.20;
        const enquiryWeight = 0.25;
        const actionsWeight = 0.30; // NEW: Weight for user actions
        
        // Normalize time spent (max 60 seconds = 1.0)
        const timeScore = Math.min(timeSpentSeconds / 60, 1);
        
        // Normalize scroll depth (0-100% = 0.0-1.0)
        const scrollScore = Math.min(scrollDepthPercent / 100, 1);
        
        // Enquiry submission (boolean to 0 or 1)
        const enquiryScore = submittedEnquiry ? 1 : 0;
        
        // NEW: Calculate actions score based on user engagement
        let actionsScore = 0;
        let actionCount = 0;
        
        // Date selections (0.1 each)
        if (actions.startFilterDate) { actionsScore += 0.1; actionCount++; }
        if (actions.endFilterDate) { actionsScore += 0.1; actionCount++; }
        
        // Event details (0.15 each)
        if (actions.eventDuration) { actionsScore += 0.15; actionCount++; }
        if (actions.occasion) { actionsScore += 0.15; actionCount++; }
        if (actions.guestCount) { actionsScore += 0.15; actionCount++; }
        
        // Food and decor selections (0.2 each)
        if (actions.foodMenuType) { actionsScore += 0.2; actionCount++; }
        if (actions.weddingDecorType) { actionsScore += 0.2; actionCount++; }
        
        // High-intent actions (0.3 each)
        if (actions.clickedOnReserved) { actionsScore += 0.3; actionCount++; }
        if (actions.clickedOnBookNow) { actionsScore += 0.4; actionCount++; }
        if (actions.madePayment) { actionsScore += 0.5; actionCount++; } // Highest weight
        
        // Normalize actions score (cap at 1.0)
        actionsScore = Math.min(actionsScore, 1.0);
        
        const qualityScore = (timeScore * timeWeight) + 
                           (scrollScore * scrollWeight) + 
                           (enquiryScore * enquiryWeight) + 
                           (actionsScore * actionsWeight);
        
        // Round to 3 decimal places
        return Math.round(qualityScore * 1000) / 1000;
    }

    async trackVenueInterest(trackingData) {
        try {
            const {
                venueId,
                venueName = '',
                location = {},
                device = {},
                engagement = {},
                user = {}
            } = trackingData;

            // Validate required fields
            if (!venueId || !user.sessionId) {
                throw new Error('venueId and sessionId are required');
            }

            // If venue name is not provided, fetch it from the venues collection
            let finalVenueName = venueName;
            if (!finalVenueName || finalVenueName.trim() === '') {
                try {
                    const venue = await this.getVenueNameFromDatabase(venueId);
                    finalVenueName = venue ? venue.name : 'Unknown Venue';
                } catch (error) {
                    console.warn(`Could not fetch venue name for ${venueId}:`, error.message);
                    finalVenueName = 'Unknown Venue';
                }
            }

            // Calculate enhanced quality score
            const qualityScore = this.calculateQualityScore(engagement);
            
            // Check if user is returning
            const isReturning = user.userId ? 
                await this.venueClickRepository.checkUserReturning(user.userId, venueId) : false;

            const clickData = {
                venueId,
                venueName: finalVenueName,
                timestamp: new Date(),
                user: {
                    userId: user.userId || null,
                    userName: user.userName || '',
                    userEmail: user.userEmail || '',
                    userContact: user.userContact || '',
                    isReturning,
                    sessionId: user.sessionId
                },
                location: {
                    lat: location.lat || null,
                    lng: location.lng || null,
                    city: location.city || null,
                    subarea: location.subarea || null,
                    state: location.state || null,
                    country: location.country || 'India',
                    pincode: location.pincode || null
                },
                device: {
                    userAgent: device.userAgent || null,
                    platform: device.platform || null,
                    browser: device.browser || null,
                    isMobile: device.isMobile || false
                },
                engagement: {
                    timeSpentSeconds: engagement.timeSpentSeconds || 0,
                    scrollDepthPercent: engagement.scrollDepthPercent || 0,
                    submittedEnquiry: engagement.submittedEnquiry || false,
                    // NEW: Include actions in engagement data
                    actions: engagement.actions || {
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
                },
                qualityScore,
                // NEW: Metadata for analytics
                qualityScoreBackfilled: false,
                qualityScoreBackfilledAt: null
            };

            console.log('Processed enhanced click data for storage:', JSON.stringify(clickData, null, 2));

            return await this.venueClickRepository.addClick(clickData);
        } catch (error) {
            throw new Error(`Failed to track venue interest: ${error.message}`);
        }
    }

/**
 * Get funnel conversion analytics
 */
async getFunnelAnalytics(venueId, dateRange = {}) {
    try {
        const pipeline = [
            {
                $match: {
                    venueId: venueId,
                    ...(dateRange.start && dateRange.end ? {
                        timestamp: {
                            $gte: new Date(dateRange.start),
                            $lte: new Date(dateRange.end)
                        }
                    } : {})
                }
            },
            {
                $group: {
                    _id: null,
                    totalVisits: { $sum: 1 },
                    occasionSelected: {
                        $sum: { $cond: [{ $ne: ['$engagement.actions.occasion', null] }, 1, 0] }
                    },
                    dateSelected: {
                        $sum: { $cond: [{ $ne: ['$engagement.actions.startFilterDate', null] }, 1, 0] }
                    },
                    guestCountSelected: {
                        $sum: { $cond: [{ $ne: ['$engagement.actions.guestCount', null] }, 1, 0] }
                    },
                    foodSelected: {
                        $sum: { $cond: [{ $ne: ['$engagement.actions.foodMenuType', null] }, 1, 0] }
                    },
                    decorSelected: {
                        $sum: { $cond: [{ $ne: ['$engagement.actions.weddingDecorType', null] }, 1, 0] }
                    },
                    enquiriesSubmitted: {
                        $sum: { $cond: ['$engagement.submittedEnquiry', 1, 0] }
                    },
                    reservedClicks: {
                        $sum: { $cond: ['$engagement.actions.clickedOnReserved', 1, 0] }
                    },
                    bookNowClicks: {
                        $sum: { $cond: ['$engagement.actions.clickedOnBookNow', 1, 0] }
                    },
                    paymentsCompleted: {
                        $sum: { $cond: ['$engagement.actions.madePayment', 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    steps: [
                        { 
                            name: 'Page Visit', 
                            count: '$totalVisits', 
                            percentage: 100 
                        },
                        { 
                            name: 'Occasion Selected', 
                            count: '$occasionSelected', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$occasionSelected', '$totalVisits'] }, 100] }, 1] 
                            }
                        },
                        { 
                            name: 'Date Selected', 
                            count: '$dateSelected', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$dateSelected', '$totalVisits'] }, 100] }, 1] 
                            }
                        },
                        { 
                            name: 'Guest Count Selected', 
                            count: '$guestCountSelected', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$guestCountSelected', '$totalVisits'] }, 100] }, 1] 
                            }
                        },
                        { 
                            name: 'Food Selected', 
                            count: '$foodSelected', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$foodSelected', '$totalVisits'] }, 100] }, 1] 
                            }
                        },
                        { 
                            name: 'Enquiry Submitted', 
                            count: '$enquiriesSubmitted', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$enquiriesSubmitted', '$totalVisits'] }, 100] }, 1] 
                            }
                        },
                        { 
                            name: 'Payment Completed', 
                            count: '$paymentsCompleted', 
                            percentage: { 
                                $round: [{ $multiply: [{ $divide: ['$paymentsCompleted', '$totalVisits'] }, 100] }, 1] 
                            }
                        }
                    ]
                }
            }
        ];

        const result = await this.venueClickRepository.aggregate(pipeline);
        return result[0] || { steps: [] };
    } catch (error) {
        throw new Error(`Failed to get funnel analytics: ${error.message}`);
    }
}

/**
 * Get action-specific analytics
 */
async getActionAnalytics(venueId, dateRange = {}) {
    try {
        const pipeline = [
            {
                $match: {
                    venueId: venueId,
                    ...(dateRange.start && dateRange.end ? {
                        timestamp: {
                            $gte: new Date(dateRange.start),
                            $lte: new Date(dateRange.end)
                        }
                    } : {})
                }
            },
            {
                $group: {
                    _id: null,
                    totalVisits: { $sum: 1 },
                    // Event Duration breakdown
                    morningEvents: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.eventDuration', 'morning'] }, 1, 0] }
                    },
                    eveningEvents: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.eventDuration', 'evening'] }, 1, 0] }
                    },
                    fullDayEvents: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.eventDuration', 'full'] }, 1, 0] }
                    },
                    // Occasion breakdown
                    weddingOccasions: {
                        $sum: { $cond: [{ $regex: ['$engagement.actions.occasion', /wedding/i] }, 1, 0] }
                    },
                    // Decor type breakdown
                    basicDecor: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.weddingDecorType', 'Basic'] }, 1, 0] }
                    },
                    standardDecor: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.weddingDecorType', 'Standard'] }, 1, 0] }
                    },
                    premiumDecor: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.weddingDecorType', 'Premium'] }, 1, 0] }
                    },
                    // Food plate breakdown
                    plate1x1: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.foodMenuPlate', '1x1'] }, 1, 0] }
                    },
                    plate2x2: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.foodMenuPlate', '2x2'] }, 1, 0] }
                    },
                    plate3x3: {
                        $sum: { $cond: [{ $eq: ['$engagement.actions.foodMenuPlate', '3x3'] }, 1, 0] }
                    },
                    // Average prices
                    avgDecorPrice: { $avg: '$engagement.actions.weddingDecorPrice' },
                    avgFoodPrice: { $avg: '$engagement.actions.foodMenuPrice' },
                    // Action counts
                    reservedClicks: {
                        $sum: { $cond: ['$engagement.actions.clickedOnReserved', 1, 0] }
                    },
                    bookNowClicks: {
                        $sum: { $cond: ['$engagement.actions.clickedOnBookNow', 1, 0] }
                    },
                    paymentsCompleted: {
                        $sum: { $cond: ['$engagement.actions.madePayment', 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalVisits: 1,
                    eventDurations: {
                        morning: '$morningEvents',
                        evening: '$eveningEvents',
                        fullDay: '$fullDayEvents'
                    },
                    decorTypes: {
                        basic: '$basicDecor',
                        standard: '$standardDecor',
                        premium: '$premiumDecor'
                    },
                    foodPlates: {
                        '1x1': '$plate1x1',
                        '2x2': '$plate2x2',
                        '3x3': '$plate3x3'
                    },
                    averagePrices: {
                        decor: { $round: ['$avgDecorPrice', 0] },
                        food: { $round: ['$avgFoodPrice', 0] }
                    },
                    actionCounts: {
                        reservedClicks: '$reservedClicks',
                        bookNowClicks: '$bookNowClicks',
                        paymentsCompleted: '$paymentsCompleted'
                    },
                    conversionRates: {
                        reservedRate: { 
                            $round: [{ $multiply: [{ $divide: ['$reservedClicks', '$totalVisits'] }, 100] }, 2] 
                        },
                        bookNowRate: { 
                            $round: [{ $multiply: [{ $divide: ['$bookNowClicks', '$totalVisits'] }, 100] }, 2] 
                        },
                        paymentRate: { 
                            $round: [{ $multiply: [{ $divide: ['$paymentsCompleted', '$totalVisits'] }, 100] }, 2] 
                        }
                    }
                }
            }
        ];

        const result = await this.venueClickRepository.aggregate(pipeline);
        return result[0] || {
            totalVisits: 0,
            eventDurations: { morning: 0, evening: 0, fullDay: 0 },
            decorTypes: { basic: 0, standard: 0, premium: 0 },
            foodPlates: { '1x1': 0, '2x2': 0, '3x3': 0 },
            averagePrices: { decor: 0, food: 0 },
            actionCounts: { reservedClicks: 0, bookNowClicks: 0, paymentsCompleted: 0 },
            conversionRates: { reservedRate: 0, bookNowRate: 0, paymentRate: 0 }
        };
    } catch (error) {
        throw new Error(`Failed to get action analytics: ${error.message}`);
    }
}

// ...existing code...

    async generateVenueInsights(venueId) {
        try {
            console.log('=== generateVenueInsights ===');
            console.log('venueId:', venueId);
            
            // Get aggregate stats first
            const aggregateStats = await this.venueClickRepository.getVenueAggregateStats(venueId);
            console.log('Aggregate stats:', aggregateStats);
            
            if (!aggregateStats || aggregateStats.length === 0) {
                console.log('No aggregate stats found for venue');
                return null;
            }

            const stats = aggregateStats[0];
            console.log('Stats object:', stats);

            // Get detailed analytics data in parallel
            const [
                heatmapPoints,
                cityStats,
                deviceStats,
                timeline,
                pincodeStats,
                subareaStats
            ] = await Promise.all([
                this.venueClickRepository.getHeatmapData(venueId),
                this.venueClickRepository.getCityStats(venueId),
                this.venueClickRepository.getDeviceStats(venueId),
                this.venueClickRepository.getTimelineData(venueId),
                this.venueClickRepository.getPincodeStats(venueId),
                this.venueClickRepository.getSubareaStats(venueId)
            ]);

            // Format device stats
            const formattedDeviceStats = deviceStats.length > 0 ? deviceStats[0] : {
                mobile: 0,
                desktop: 0,
                tablet: 0
            };

            const insightData = {
                heatmapPoints: heatmapPoints || [],
                cityStats: cityStats || [],
                subareaStats: subareaStats || [],
                deviceStats: formattedDeviceStats,
                timeline: timeline || [],
                topPincodes: pincodeStats || [],
                totalClicks: stats.totalClicks || 0,
                averageQualityScore: Math.round((stats.averageQualityScore || 0) * 100) / 100,
                averageTimeSpent: Math.round((stats.averageTimeSpent || 0) * 100) / 100,
                averageScrollDepth: Math.round((stats.averageScrollDepth || 0) * 100) / 100,
                enquirySubmissions: stats.enquirySubmissions || 0
            };

            console.log('Generated insightData:', insightData);
            
            // Save insights to database
            await this.venueInsightRepository.upsertInsight(venueId, insightData);
            console.log('Insights saved to database');
            
            // Return the actual insights data
            return insightData;
        } catch (error) {
            throw new Error(`Failed to generate insights for venue ${venueId}: ${error.message}`);
        }
    }

    async saveVenueInsights(venueId, insights) {
        try {
            return await this.venueInsightRepository.upsertInsight(venueId, insights);
        } catch (error) {
            throw new Error(`Failed to save insights for venue ${venueId}: ${error.message}`);
        }
    }

    async updateAllVenueInsights() {
        try {
            // Get all unique venue IDs from clicks
            const venueIds = await this.venueClickRepository.getUniqueVenueIds();
            
            const results = [];
            let successful = 0;
            let failed = 0;

            for (const venueId of venueIds) {
                try {
                    const insight = await this.generateVenueInsights(venueId);
                    results.push({ 
                        venueId, 
                        success: true, 
                        insight: insight ? 'Updated' : 'No data'
                    });
                    successful++;
                } catch (error) {
                    results.push({ 
                        venueId, 
                        success: false, 
                        error: error.message 
                    });
                    failed++;
                }
            }

            return {
                totalProcessed: venueIds.length,
                successful,
                failed,
                results
            };
        } catch (error) {
            throw new Error(`Failed to update venue insights: ${error.message}`);
        }
    }

    async getVenueInsights(venueId, from, to) {
        try {
            console.log('=== AnalyticsService.getVenueInsights ===');
            console.log('venueId:', venueId);
            console.log('Date range:', { from, to });
            
            // If date range is provided, generate insights for that specific period
            if (from && to) {
                console.log('Generating insights for specific date range');
                return await this.generateVenueInsightsForDateRange(venueId, from, to);
            }
            
            // Otherwise, get stored insights or generate new ones
            let insights = await this.venueInsightRepository.getInsightByVenue(venueId);
            console.log('Existing insights found:', !!insights);
            
            if (!insights) {
                console.log('No insights found, generating new ones...');
                // Try to generate insights if none exist
                insights = await this.generateVenueInsights(venueId);
                console.log('Generated insights:', !!insights);
                
                if (!insights) {
                    console.log('Could not generate insights - no click data available');
                    return null;
                }
            }

            console.log('Returning insights with keys:', Object.keys(insights));
            return insights;
        } catch (error) {
            console.error('Error in getVenueInsights:', error);
            throw new Error(`Failed to get insights for venue ${venueId}: ${error.message}`);
        }
    }

    async generateVenueInsightsForDateRange(venueId, from, to) {
        try {
            console.log('=== generateVenueInsightsForDateRange ===');
            console.log('venueId:', venueId);
            console.log('Date range:', { from, to });
            
            const dateRange = {
                start: new Date(from),
                end: new Date(to)
            };
            
            // Get clicks for the venue in the date range
            const clicks = await this.venueClickRepository.getClicksByVenue(venueId, dateRange);
            console.log('Clicks found for date range:', clicks.length);
            
            if (!clicks || clicks.length === 0) {
                console.log('No clicks found for venue in date range');
                return {
                    totalClicks: 0,
                    averageQualityScore: 0,
                    averageTimeSpent: 0,
                    averageScrollDepth: 0,
                    enquirySubmissions: 0,
                    heatmapPoints: [],
                    cityStats: [],
                    subareaStats: [],
                    deviceStats: { mobile: 0, desktop: 0, tablet: 0 },
                    timeline: [],
                    topPincodes: [],
                    dateFiltered: true,
                    dateRange: { from, to }
                };
            }

            // Calculate aggregate stats from clicks
            const totalClicks = clicks.length;
            const averageQualityScore = clicks.reduce((sum, click) => sum + (click.qualityScore || 0), 0) / totalClicks;
            const averageTimeSpent = clicks.reduce((sum, click) => sum + (click.engagement?.timeSpentSeconds || 0), 0) / totalClicks;
            const averageScrollDepth = clicks.reduce((sum, click) => sum + (click.engagement?.scrollDepthPercent || 0), 0) / totalClicks;
            const enquirySubmissions = clicks.filter(click => click.engagement?.submittedEnquiry === true).length;

            // Process city stats
            const cityStats = Object.values(clicks.reduce((acc, click) => {
                const city = click.location?.city || 'Unknown';
                if (!acc[city]) {
                    acc[city] = { city, clicks: 0 };
                }
                acc[city].clicks++;
                return acc;
            }, {})).sort((a, b) => b.clicks - a.clicks);

            // Process device stats
            const deviceStats = {
                mobile: clicks.filter(click => click.device?.isMobile === true).length,
                desktop: clicks.filter(click => click.device?.isMobile === false).length,
                tablet: clicks.filter(click => click.device?.platform?.toLowerCase().includes('tablet')).length
            };

            // Process subarea stats
            const subareaStats = Object.values(clicks.reduce((acc, click) => {
                const subarea = click.location?.subarea;
                if (subarea) {
                    if (!acc[subarea]) {
                        acc[subarea] = { subarea, clicks: 0 };
                    }
                    acc[subarea].clicks++;
                }
                return acc;
            }, {})).sort((a, b) => b.clicks - a.clicks);

            // Process pincode stats
            const topPincodes = Object.values(clicks.reduce((acc, click) => {
                const pincode = click.location?.pincode;
                if (pincode) {
                    if (!acc[pincode]) {
                        acc[pincode] = { pincode, count: 0 };
                    }
                    acc[pincode].count++;
                }
                return acc;
            }, {})).sort((a, b) => b.count - a.count).slice(0, 10);

            // Process timeline data - group clicks by date
            const timelineData = {};
            clicks.forEach(click => {
                const dateKey = click.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD format
                if (!timelineData[dateKey]) {
                    timelineData[dateKey] = 0;
                }
                timelineData[dateKey]++;
            });

            // Convert to array format and sort by date
            const timeline = Object.entries(timelineData)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // Process heatmap points - extract location data
            const heatmapPoints = clicks
                .filter(click => click.location?.lat && click.location?.lng)
                .map(click => ({
                    lat: click.location.lat,
                    lng: click.location.lng,
                    intensity: click.qualityScore || 0.5
                }));

            const insightData = {
                heatmapPoints,
                cityStats,
                subareaStats,
                deviceStats,
                timeline,
                topPincodes,
                totalClicks,
                averageQualityScore: Math.round(averageQualityScore * 100) / 100,
                averageTimeSpent: Math.round(averageTimeSpent * 100) / 100,
                averageScrollDepth: Math.round(averageScrollDepth * 100) / 100,
                enquirySubmissions,
                dateFiltered: true,
                dateRange: { from, to }
            };

            console.log('Generated date-filtered insightData:', insightData);
            
            // Don't save date-filtered insights to database, return them directly
            return insightData;
        } catch (error) {
            throw new Error(`Failed to generate date-filtered insights for venue ${venueId}: ${error.message}`);
        }
    }

    async getVenueClicks(venueId, options = {}) {
        try {
            const { from, to, limit = 100, skip = 0 } = options;
            
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            const clicks = await this.venueClickRepository.getClicksByVenue(venueId, dateRange);
            
            // Apply pagination
            return clicks.slice(skip, skip + limit);
        } catch (error) {
            throw new Error(`Failed to get clicks for venue ${venueId}: ${error.message}`);
        }
    }

    async getGeographicDistribution(venueId, from, to) {
        try {
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getGeographicDistribution(venueId, dateRange);
        } catch (error) {
            throw new Error(`Failed to get geographic distribution for venue ${venueId}: ${error.message}`);
        }
    }

    async getOverallStats(from, to, venueFilter = null) {
        try {
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getOverallStats(dateRange, venueFilter);
        } catch (error) {
            throw new Error(`Failed to get overall stats: ${error.message}`);
        }
    }

    async getPopularVenues(options = {}) {
        try {
            const { from, to, limit = 10, venueFilter = null } = options;
            
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getPopularVenues(dateRange, limit, venueFilter);
        } catch (error) {
            throw new Error(`Failed to get popular venues: ${error.message}`);
        }
    }

    async getDeviceAnalytics(from, to, venueFilter = null) {
        try {
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getDeviceAnalytics(dateRange, venueFilter);
        } catch (error) {
            throw new Error(`Failed to get device analytics: ${error.message}`);
        }
    }

    async getTimelineAnalytics(from, to, venueFilter = null) {
        try {
            const dateRange = {};
            if (from) dateRange.start = new Date(from);
            if (to) dateRange.end = new Date(to);

            return await this.venueClickRepository.getTimelineAnalytics(dateRange, venueFilter);
        } catch (error) {
            throw new Error(`Failed to get timeline analytics: ${error.message}`);
        }
    }

    async getTopSubareas(from, to, venueFilter = null, limit = 10) {
        try {
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getTopSubareas(dateRange, venueFilter, limit);
        } catch (error) {
            throw new Error(`Failed to get top subareas: ${error.message}`);
        }
    }

    async getUserClickDetails(venueId, from, to, includeUserInfo = false) {
        try {
            console.log('=== AnalyticsService.getUserClickDetails ===');
            console.log('Input parameters:');
            console.log('- venueId:', venueId);
            console.log('- from:', from);
            console.log('- to:', to);
            console.log('- includeUserInfo:', includeUserInfo);
            
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;
            
            console.log('Constructed dateRange:', dateRange);

            const result = await this.venueClickRepository.getUserClickDetails(venueId, dateRange, includeUserInfo);
            console.log('Repository result:', {
                resultType: Array.isArray(result) ? 'array' : typeof result,
                resultLength: Array.isArray(result) ? result.length : 'N/A',
                sampleData: Array.isArray(result) && result.length > 0 ? result[0] : null
            });
            
            return result;
        } catch (error) {
            console.error('Error in AnalyticsService.getUserClickDetails:', error);
            throw new Error(`Failed to get user click details: ${error.message}`);
        }
    }

    async getMultipleVenueInsights(venueIds) {
        try {
            return await this.venueInsightRepository.getInsightsByVenues(venueIds);
        } catch (error) {
            throw new Error(`Failed to get insights for multiple venues: ${error.message}`);
        }
    }

    async getAnalyticsSummary() {
        try {
            const [totalClicks, totalInsights, venueIds] = await Promise.all([
                this.venueClickRepository.getCount(),
                this.venueInsightRepository.getInsightsCount(),
                this.venueClickRepository.getUniqueVenueIds()
            ]);

            return {
                totalClicks,
                totalInsights,
                totalVenues: venueIds.length,
                lastUpdated: new Date()
            };
        } catch (error) {
            throw new Error(`Failed to get analytics summary: ${error.message}`);
        }
    }

    async getVenueClickHistory(venueId, options = {}) {
        try {
            const {
                startDate,
                endDate,
                limit = 100,
                includeDetails = false
            } = options;

            const dateRange = {};
            if (startDate) dateRange.start = startDate;
            if (endDate) dateRange.end = endDate;

            const clicks = await this.venueClickRepository.getClicksByVenue(venueId, dateRange);
            
            if (!includeDetails) {
                // Return summarized data
                return clicks.map(click => ({
                    timestamp: click.timestamp,
                    city: click.location?.city,
                    platform: click.device?.platform,
                    qualityScore: click.qualityScore,
                    isReturning: click.user?.isReturning
                }));
            }

            return clicks.slice(0, limit);
        } catch (error) {
            throw new Error(`Failed to get click history for venue ${venueId}: ${error.message}`);
        }
    }

    async getVenueTimelineAnalytics(venueId, from, to) {
        try {
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return await this.venueClickRepository.getVenueTimelineAnalytics(venueId, dateRange);
        } catch (error) {
            throw new Error(`Failed to get venue timeline analytics: ${error.message}`);
        }
    }

    // NEW: Get venue clicks for a specific venue
    getVenueClicks(venueId, options = {}) {
        try {
            const { from, to, limit = 100, skip = 0 } = options;
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return this.venueClickRepository.getVenueClicks(venueId, {
                dateRange,
                limit,
                skip
            });
        } catch (error) {
            throw new Error(`Failed to get venue clicks: ${error.message}`);
        }
    }

    // NEW: Get all venue clicks (for all venues analytics)
    getAllVenueClicks(options = {}) {
        try {
            const { from, to, limit = 100, skip = 0 } = options;
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return this.venueClickRepository.getAllVenueClicks({
                dateRange,
                limit,
                skip
            });
        } catch (error) {
            throw new Error(`Failed to get all venue clicks: ${error.message}`);
        }
    }

    // NEW: Get aggregated venue clicks for a specific venue
    getVenueClicksAggregated(venueId, options = {}) {
        try {
            const { from, to, groupBy = 'date' } = options;
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return this.venueClickRepository.getVenueClicksAggregated(venueId, {
                dateRange,
                groupBy
            });
        } catch (error) {
            throw new Error(`Failed to get aggregated venue clicks: ${error.message}`);
        }
    }

    // NEW: Get aggregated all venue clicks (for all venues aggregated analytics)
    getAllVenueClicksAggregated(options = {}) {
        try {
            const { from, to, groupBy = 'date' } = options;
            const dateRange = {};
            if (from) dateRange.start = from;
            if (to) dateRange.end = to;

            return this.venueClickRepository.getAllVenueClicksAggregated({
                dateRange,
                groupBy
            });
        } catch (error) {
            throw new Error(`Failed to get aggregated all venue clicks: ${error.message}`);
        }
    }
}

module.exports = AnalyticsService;
