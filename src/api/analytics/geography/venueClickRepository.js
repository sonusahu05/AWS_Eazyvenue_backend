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

    async getOverallStats(dateRange = {}) {
        try {
            const matchQuery = {};
            
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

    async getPopularVenues(dateRange = {}, limit = 10) {
        try {
            const matchQuery = {};
            
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
                                _id: '$venueId',
                                clicks: { $sum: 1 },
                                averageQualityScore: { $avg: '$qualityScore' },
                                uniqueUsers: { $addToSet: '$user.userId' },
                                topCities: { $addToSet: '$location.city' },
                                enquiryRate: {
                                    $avg: { $cond: [{ $eq: ['$engagement.submittedEnquiry', true] }, 1, 0] }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                venueId: '$_id',
                                clicks: 1,
                                averageQualityScore: { $round: ['$averageQualityScore', 2] },
                                uniqueUsersCount: { $size: '$uniqueUsers' },
                                topCities: { $slice: ['$topCities', 3] },
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

    async getDeviceAnalytics(dateRange = {}) {
        try {
            const matchQuery = {};
            
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
}

module.exports = VenueClickRepository;
