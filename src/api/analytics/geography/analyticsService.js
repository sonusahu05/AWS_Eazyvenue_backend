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
        const { timeSpentSeconds = 0, scrollDepthPercent = 0, submittedEnquiry = false } = engagementData;
        
        // Weighted scoring algorithm
        const timeWeight = 0.4;
        const scrollWeight = 0.3;
        const enquiryWeight = 0.3;
        
        // Normalize time spent (max 60 seconds = 1.0)
        const timeScore = Math.min(timeSpentSeconds / 60, 1);
        
        // Normalize scroll depth (0-100% = 0.0-1.0)
        const scrollScore = Math.min(scrollDepthPercent / 100, 1);
        
        // Enquiry submission (boolean to 0 or 1)
        const enquiryScore = submittedEnquiry ? 1 : 0;
        
        const qualityScore = (timeScore * timeWeight) + (scrollScore * scrollWeight) + (enquiryScore * enquiryWeight);
        
        // Round to 2 decimal places
        return Math.round(qualityScore * 100) / 100;
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

            // Calculate quality score
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
                    submittedEnquiry: engagement.submittedEnquiry || false
                },
                qualityScore
            };

            console.log('Processed click data for storage:', JSON.stringify(clickData, null, 2));

            return await this.venueClickRepository.addClick(clickData);
        } catch (error) {
            throw new Error(`Failed to track venue interest: ${error.message}`);
        }
    }

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
}

module.exports = AnalyticsService;
