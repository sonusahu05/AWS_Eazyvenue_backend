const { ObjectId } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');

class VenueClickRepository extends BaseRepository {
    constructor() {
        super('analytics.geography.venue_clicks');
    }

    async addClick(clickData) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .insertOne(clickData));
        } catch (error) {
            throw new Error(`Failed to add venue click: ${error.message}`);
        }
    }

    async getClicksByVenue(venueId, dateRange = {}) {
        try {
            const query = { venueId };
            
            if (dateRange.start && dateRange.end) {
                query.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .find(query)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get clicks for venue ${venueId}: ${error.message}`);
        }
    }

    async checkUserReturning(userId, venueId) {
        try {
            if (!userId) return false;
            
            const existingClick = await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .findOne({ 
                        'user.userId': userId,
                        venueId: venueId 
                    }));
            
            return !!existingClick;
        } catch (error) {
            throw new Error(`Failed to check returning user: ${error.message}`);
        }
    }

    async getHeatmapData(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { 
                            $match: { 
                                venueId,
                                'location.lat': { $exists: true, $ne: null },
                                'location.lng': { $exists: true, $ne: null }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    lat: '$location.lat',
                                    lng: '$location.lng'
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                lat: '$_id.lat',
                                lng: '$_id.lng',
                                count: 1
                            }
                        },
                        { $sort: { count: -1 } }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get heatmap data for venue ${venueId}: ${error.message}`);
        }
    }

    async getCityStats(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { 
                            $match: { 
                                venueId,
                                'location.city': { $exists: true, $ne: null }
                            }
                        },
                        {
                            $group: {
                                _id: '$location.city',
                                clicks: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                city: '$_id',
                                clicks: 1
                            }
                        },
                        { $sort: { clicks: -1 } },
                        { $limit: 10 }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get city stats for venue ${venueId}: ${error.message}`);
        }
    }

    async getDeviceStats(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: { venueId } },
                        {
                            $group: {
                                _id: null,
                                mobile: {
                                    $sum: {
                                        $cond: [{ $eq: ['$device.isMobile', true] }, 1, 0]
                                    }
                                },
                                desktop: {
                                    $sum: {
                                        $cond: [{ $eq: ['$device.isMobile', false] }, 1, 0]
                                    }
                                },
                                tablet: {
                                    $sum: {
                                        $cond: [
                                            { 
                                                $and: [
                                                    { $ne: ['$device.isMobile', true] },
                                                    { $regexMatch: { input: '$device.platform', regex: /tablet/i } }
                                                ]
                                            }, 
                                            1, 
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                mobile: 1,
                                desktop: 1,
                                tablet: 1
                            }
                        }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get device stats for venue ${venueId}: ${error.message}`);
        }
    }

    async getTimelineData(venueId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { 
                            $match: { 
                                venueId,
                                timestamp: { $gte: startDate }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$timestamp'
                                    }
                                },
                                clicks: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                date: '$_id',
                                clicks: 1
                            }
                        },
                        { $sort: { date: 1 } }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get timeline data for venue ${venueId}: ${error.message}`);
        }
    }

    async getPincodeStats(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { 
                            $match: { 
                                venueId,
                                'location.pincode': { $exists: true, $ne: null }
                            }
                        },
                        {
                            $group: {
                                _id: '$location.pincode',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                pincode: '$_id',
                                count: 1
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get pincode stats for venue ${venueId}: ${error.message}`);
        }
    }

    async getSubareaStats(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { 
                            $match: { 
                                venueId,
                                'location.subarea': { $exists: true, $ne: null, $ne: '' }
                            }
                        },
                        {
                            $group: {
                                _id: '$location.subarea',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                subarea: '$_id',
                                count: 1
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get subarea stats for venue ${venueId}: ${error.message}`);
        }
    }

    async getUniqueVenueIds() {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .distinct('venueId'));
        } catch (error) {
            throw new Error(`Failed to get unique venue IDs: ${error.message}`);
        }
    }

    async getVenueAggregateStats(venueId) {
        try {
            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: { venueId } },
                        {
                            $group: {
                                _id: venueId,
                                totalClicks: { $sum: 1 },
                                averageQualityScore: { $avg: '$qualityScore' },
                                averageTimeSpent: { $avg: '$engagement.timeSpentSeconds' },
                                averageScrollDepth: { $avg: '$engagement.scrollDepthPercent' },
                                enquirySubmissions: {
                                    $sum: {
                                        $cond: [{ $eq: ['$engagement.submittedEnquiry', true] }, 1, 0]
                                    }
                                }
                            }
                        }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get aggregate stats for venue ${venueId}: ${error.message}`);
        }
    }

    // Geographic-specific methods for enhanced analytics
    async getGeographicDistribution(venueId, dateRange = {}) {
        try {
            const matchQuery = { venueId };
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: {
                                    city: '$location.city',
                                    state: '$location.state',
                                    country: '$location.country'
                                },
                                clicks: { $sum: 1 },
                                averageQualityScore: { $avg: '$qualityScore' },
                                uniqueUsers: { $addToSet: '$user.userId' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                city: '$_id.city',
                                state: '$_id.state',
                                country: '$_id.country',
                                clicks: 1,
                                averageQualityScore: { $round: ['$averageQualityScore', 2] },
                                uniqueUsersCount: { $size: '$uniqueUsers' }
                            }
                        },
                        { $sort: { clicks: -1 } }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get geographic distribution: ${error.message}`);
        }
    }

    async getOverallStats(dateRange = {}, venueFilter = null) {
        try {
            const matchQuery = {};
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            // Add venue filter if provided (for venue owners)
            if (venueFilter) {
                matchQuery.venueId = venueFilter;
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: null,
                                totalClicks: { $sum: 1 },
                                uniqueVenues: { $addToSet: '$venueId' },
                                uniqueUsers: { $addToSet: '$user.userId' },
                                uniqueCities: { $addToSet: '$location.city' },
                                averageQualityScore: { $avg: '$qualityScore' },
                                mobileClicks: {
                                    $sum: { $cond: [{ $eq: ['$device.isMobile', true] }, 1, 0] }
                                },
                                desktopClicks: {
                                    $sum: { $cond: [{ $eq: ['$device.isMobile', false] }, 1, 0] }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                totalClicks: 1,
                                uniqueVenuesCount: { $size: '$uniqueVenues' },
                                uniqueUsersCount: { $size: '$uniqueUsers' },
                                uniqueCitiesCount: { $size: '$uniqueCities' },
                                averageQualityScore: { $round: ['$averageQualityScore', 2] },
                                mobileClicks: 1,
                                desktopClicks: 1,
                                mobilePercentage: { 
                                    $round: [{ 
                                        $multiply: [{ 
                                            $divide: ['$mobileClicks', '$totalClicks'] 
                                        }, 100] 
                                    }, 1] 
                                }
                            }
                        }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get overall stats: ${error.message}`);
        }
    }

    async getPopularVenues(dateRange = {}, limit = 10, venueFilter = null) {
        try {
            const matchQuery = {};
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            // Add venue filter if provided (for venue owners)
            if (venueFilter) {
                matchQuery.venueId = venueFilter;
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: '$venueId',
                                venueName: { $first: '$venueName' },
                                clicks: { $sum: 1 },
                                averageQualityScore: { $avg: '$qualityScore' },
                                uniqueUsers: { $addToSet: '$user.userId' },
                                topCities: { $addToSet: '$location.city' },
                                topSubareas: { $addToSet: '$location.subarea' },
                                enquiryRate: {
                                    $avg: { $cond: [{ $eq: ['$engagement.submittedEnquiry', true] }, 1, 0] }
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'venues',
                                let: { venueId: { $toObjectId: '$_id' } },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$_id', '$$venueId'] } } },
                                    { $project: { name: 1, _id: 0 } }
                                ],
                                as: 'venueInfo'
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                venueId: '$_id',
                                venueName: {
                                    $cond: [
                                        { $and: [
                                            { $ne: ['$venueName', null] },
                                            { $ne: ['$venueName', ''] }
                                        ]},
                                        '$venueName',
                                        { $ifNull: [{ $arrayElemAt: ['$venueInfo.name', 0] }, 'Unknown Venue'] }
                                    ]
                                },
                                clicks: 1,
                                averageQualityScore: { $round: ['$averageQualityScore', 2] },
                                uniqueUsersCount: { $size: '$uniqueUsers' },
                                topCities: { 
                                    $filter: {
                                        input: { $slice: ['$topCities', 5] },
                                        cond: { $and: [{ $ne: ['$$this', null] }, { $ne: ['$$this', ''] }] }
                                    }
                                },
                                topSubareas: { 
                                    $filter: {
                                        input: { $slice: ['$topSubareas', 5] },
                                        cond: { $and: [{ $ne: ['$$this', null] }, { $ne: ['$$this', ''] }] }
                                    }
                                },
                                enquiryRate: { $round: [{ $multiply: ['$enquiryRate', 100] }, 1] }
                            }
                        },
                        { $sort: { clicks: -1 } },
                        { $limit: limit }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get popular venues: ${error.message}`);
        }
    }

    async getDeviceAnalytics(dateRange = {}, venueFilter = null) {
        try {
            const matchQuery = {};
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            // Add venue filter if provided
            if (venueFilter) {
                matchQuery.venueId = venueFilter;
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: {
                                    platform: '$device.platform',
                                    browser: '$device.browser',
                                    isMobile: '$device.isMobile'
                                },
                                clicks: { $sum: 1 },
                                averageQualityScore: { $avg: '$qualityScore' },
                                averageTimeSpent: { $avg: '$engagement.timeSpentSeconds' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                platform: '$_id.platform',
                                browser: '$_id.browser',
                                isMobile: '$_id.isMobile',
                                clicks: 1,
                                averageQualityScore: { $round: ['$averageQualityScore', 2] },
                                averageTimeSpent: { $round: ['$averageTimeSpent', 0] }
                            }
                        },
                        { $sort: { clicks: -1 } }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get device analytics: ${error.message}`);
        }
    }

    async getTimelineAnalytics(dateRange = {}, venueFilter = null) {
        try {
            const matchQuery = {};
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            } else {
                // Default to last 30 days if no range provided
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                matchQuery.timestamp = { $gte: startDate };
            }

            // Add venue filter if provided
            if (venueFilter) {
                matchQuery.venueId = venueFilter;
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$timestamp'
                                    }
                                },
                                clicks: { $sum: 1 },
                                uniqueUsers: { $addToSet: '$user.userId' },
                                enquiries: { 
                                    $sum: { $cond: [{ $eq: ['$engagement.submittedEnquiry', true] }, 1, 0] }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                date: '$_id',
                                clicks: 1,
                                uniqueUsers: { $size: '$uniqueUsers' },
                                enquiries: 1
                            }
                        },
                        { $sort: { date: 1 } }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get timeline analytics: ${error.message}`);
        }
    }

    async getTopSubareas(dateRange = {}, venueFilter = null, limit = 10) {
        try {
            const matchQuery = {
                'location.subarea': { $exists: true, $ne: null, $ne: '' }
            };
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            // Add venue filter if provided
            if (venueFilter) {
                matchQuery.venueId = venueFilter;
            }

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: '$location.subarea',
                                clicks: { $sum: 1 },
                                uniqueUsers: { $addToSet: '$user.userId' },
                                uniqueVenues: { $addToSet: '$venueId' },
                                averageQualityScore: { $avg: '$qualityScore' }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                subarea: '$_id',
                                clicks: 1,
                                uniqueUsers: { $size: '$uniqueUsers' },
                                uniqueVenues: { $size: '$uniqueVenues' },
                                averageQualityScore: { $round: ['$averageQualityScore', 2] }
                            }
                        },
                        { $sort: { clicks: -1 } },
                        { $limit: limit }
                    ])
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get top subareas: ${error.message}`);
        }
    }

    async getUserClickDetails(venueId, dateRange = {}, includeUserInfo = false) {
        try {
            console.log('=== VenueClickRepository.getUserClickDetails ===');
            console.log('Input parameters:');
            console.log('- venueId:', venueId, '(type:', typeof venueId, ')');
            console.log('- dateRange:', dateRange);
            console.log('- includeUserInfo:', includeUserInfo);
            
            const matchQuery = { venueId };
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
                console.log('Date filter applied:', matchQuery.timestamp);
            }
            
            console.log('Final matchQuery:', JSON.stringify(matchQuery, null, 2));

            const projection = {
                venueId: 1,
                venueName: 1,
                timestamp: 1,
                'location.city': 1,
                'location.subarea': 1,
                'device.platform': 1,
                'device.isMobile': 1,
                qualityScore: 1,
                'engagement.submittedEnquiry': 1,
                'user.userId': 1,
                'user.isReturning': 1,
                'user.sessionId': 1
            };

            // Include user contact info only if specifically requested (admin access)
            if (includeUserInfo) {
                projection['user.userName'] = 1;
                projection['user.userEmail'] = 1;
                projection['user.userContact'] = 1;
                console.log('Including user contact info (admin access)');
            }
            
            console.log('Projection:', JSON.stringify(projection, null, 2));

            // First, let's check if collection has any data
            const totalCount = await this.dbClient
                .then(db => db.collection(this.collection).countDocuments());
            console.log('Total documents in collection:', totalCount);
            
            // Check documents for this specific venue
            const venueCount = await this.dbClient
                .then(db => db.collection(this.collection).countDocuments({ venueId }));
            console.log('Documents for this venueId:', venueCount);

            const result = await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .find(matchQuery, { projection })
                    .sort({ timestamp: -1 })
                    .limit(1000) // Limit to prevent massive data loads
                    .toArray());
                    
            console.log('Query result:', {
                resultLength: result.length,
                sampleDocument: result.length > 0 ? JSON.stringify(result[0], null, 2) : 'No documents found'
            });
            
            return result;
        } catch (error) {
            console.error('Error in VenueClickRepository.getUserClickDetails:', error);
            throw new Error(`Failed to get user click details: ${error.message}`);
        }
    }

    async getVenueTimelineAnalytics(venueId, dateRange = {}) {
        try {
            const matchQuery = { venueId };
            
            if (dateRange.start && dateRange.end) {
                matchQuery.timestamp = {
                    $gte: new Date(dateRange.start),
                    $lte: new Date(dateRange.end)
                };
            }

            const pipeline = [
                { $match: matchQuery },
                {
                    $addFields: {
                        dateString: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: "$dateString",
                        date: { $first: "$dateString" },
                        clicks: { $sum: 1 },
                        uniqueUsers: { $addToSet: "$user.sessionId" },
                        enquiries: {
                            $sum: {
                                $cond: [{ $eq: ["$engagement.submittedEnquiry", true] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        uniqueUsers: { $size: "$uniqueUsers" }
                    }
                },
                {
                    $sort: { _id: 1 }
                },
                {
                    $project: {
                        _id: 0,
                        date: 1,
                        clicks: 1,
                        uniqueUsers: 1,
                        enquiries: 1
                    }
                }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get venue timeline analytics: ${error.message}`);
        }
    }

    async getVenueAggregateStats(venueId) {
        try {
            console.log('=== getVenueAggregateStats ===');
            console.log('venueId:', venueId);
            
            const pipeline = [
                {
                    $match: { venueId: venueId }
                },
                {
                    $group: {
                        _id: "$venueId",
                        totalClicks: { $sum: 1 },
                        averageQualityScore: { $avg: "$qualityScore" },
                        averageTimeSpent: { $avg: "$engagement.timeSpentSeconds" },
                        averageScrollDepth: { $avg: "$engagement.scrollDepthPercent" },
                        enquirySubmissions: {
                            $sum: {
                                $cond: [{ $eq: ["$engagement.submittedEnquiry", true] }, 1, 0]
                            }
                        }
                    }
                }
            ];

            const result = await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
                    
            console.log('getVenueAggregateStats result:', result);
            return result;
        } catch (error) {
            console.error('Error in getVenueAggregateStats:', error);
            throw new Error(`Failed to get venue aggregate stats: ${error.message}`);
        }
    }

    async getHeatmapData(venueId) {
        try {
            const result = await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .find(
                        { venueId: venueId },
                        { 
                            projection: { 
                                'location.latitude': 1, 
                                'location.longitude': 1,
                                qualityScore: 1
                            } 
                        }
                    )
                    .toArray());
            
            return result.filter(item => 
                item.location && 
                item.location.latitude && 
                item.location.longitude
            );
        } catch (error) {
            throw new Error(`Failed to get heatmap data: ${error.message}`);
        }
    }

    async getCityStats(venueId) {
        try {
            const pipeline = [
                { $match: { venueId: venueId } },
                {
                    $group: {
                        _id: "$location.city",
                        clicks: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        city: "$_id",
                        clicks: 1
                    }
                },
                { $sort: { clicks: -1 } },
                { $limit: 10 }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get city stats: ${error.message}`);
        }
    }

    async getDeviceStats(venueId) {
        try {
            const pipeline = [
                { $match: { venueId: venueId } },
                {
                    $group: {
                        _id: null,
                        mobile: {
                            $sum: {
                                $cond: [{ $eq: ["$device.isMobile", true] }, 1, 0]
                            }
                        },
                        desktop: {
                            $sum: {
                                $cond: [{ $eq: ["$device.isMobile", false] }, 1, 0]
                            }
                        },
                        tablet: {
                            $sum: {
                                $cond: [{ $eq: ["$device.platform", "tablet"] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        mobile: 1,
                        desktop: 1,
                        tablet: 1
                    }
                }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get device stats: ${error.message}`);
        }
    }

    async getTimelineData(venueId) {
        try {
            const pipeline = [
                { $match: { venueId: venueId } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp"
                            }
                        },
                        clicks: { $sum: 1 },
                        enquiries: {
                            $sum: {
                                $cond: [{ $eq: ["$engagement.submittedEnquiry", true] }, 1, 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: "$_id",
                        clicks: 1,
                        enquiries: 1
                    }
                },
                { $sort: { date: 1 } }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get timeline data: ${error.message}`);
        }
    }

    async getPincodeStats(venueId) {
        try {
            const pipeline = [
                { $match: { venueId: venueId } },
                {
                    $group: {
                        _id: "$location.pincode",
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        pincode: "$_id",
                        count: 1
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get pincode stats: ${error.message}`);
        }
    }

    async getSubareaStats(venueId) {
        try {
            const pipeline = [
                { $match: { venueId: venueId } },
                {
                    $group: {
                        _id: "$location.subarea",
                        clicks: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        subarea: "$_id",
                        clicks: 1
                    }
                },
                { $sort: { clicks: -1 } },
                { $limit: 10 }
            ];

            return await this.dbClient
                .then(db => db
                    .collection(this.collection)
                    .aggregate(pipeline)
                    .toArray());
        } catch (error) {
            throw new Error(`Failed to get subarea stats: ${error.message}`);
        }
    }
}

module.exports = VenueClickRepository;
