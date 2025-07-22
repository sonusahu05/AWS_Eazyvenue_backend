const { MongoClient, ObjectId } = require('mongodb');
const config = require('../../../config/default');
const ExcelJS = require('exceljs');

class VenueAnalyticsService {
    constructor() {
        this.dbUrl = config.db.url;
        this.dbName = config.db.name;
        this.client = null;
    }

    async connectDB() {
        if (!this.client) {
            this.client = new MongoClient(this.dbUrl);
            await this.client.connect();
        }
        return this.client.db(this.dbName);
    }

    async closeDB() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }

    /**
     * Get hot dates analytics - which dates are trending for bookings
     */
    async getHotDatesAnalytics({ venueId, from, to, limit = 50 }) {
        const db = await this.connectDB();
        const collection = db.collection('analytics.geography.venue_clicks');

        try {
            const matchStage = {};
            
            if (venueId) {
                matchStage.venueId = venueId;
            }

            // Date filtering based on engagement.actions.startFilterDate
            if (from || to) {
                const dateQuery = {};
                if (from) dateQuery.$gte = from;
                if (to) dateQuery.$lte = to;
                matchStage['engagement.actions.startFilterDate'] = dateQuery;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $match: {
                        'engagement.actions.startFilterDate': { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$engagement.actions.startFilterDate',
                        bookingCount: {
                            $sum: {
                                $cond: [
                                    { $or: [
                                        { $eq: ['$engagement.actions.clickedOnBookNow', true] },
                                        { $eq: ['$engagement.actions.clickedOnReserved', true] }
                                    ]},
                                    1,
                                    0
                                ]
                            }
                        },
                        enquiryCount: {
                            $sum: {
                                $cond: [{ $eq: ['$engagement.actions.sendEnquiryClicked', true] }, 1, 0]
                            }
                        },
                        clickCount: { $sum: 1 },
                        occasions: { $addToSet: '$engagement.actions.occasion' },
                        averageGuestCount: {
                            $avg: {
                                $toInt: {
                                    $cond: [
                                        { $ne: ['$engagement.actions.guestCount', null] },
                                        '$engagement.actions.guestCount',
                                        0
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        date: '$_id',
                        totalInterest: { $add: ['$bookingCount', '$enquiryCount'] },
                        heatIntensity: {
                            $divide: [
                                { $add: ['$bookingCount', { $multiply: ['$enquiryCount', 0.5] }] },
                                { $add: ['$clickCount', 1] }
                            ]
                        }
                    }
                },
                { $sort: { totalInterest: -1, date: 1 } },
                { $limit: parseInt(limit) }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            
            return result.map(item => ({
                date: item.date,
                bookingCount: item.bookingCount,
                enquiryCount: item.enquiryCount,
                clickCount: item.clickCount,
                heatIntensity: Math.min(item.heatIntensity || 0, 1), // Normalize to 0-1
                occasions: item.occasions.filter(o => o), // Remove null values
                averageGuestCount: Math.round(item.averageGuestCount || 0)
            }));

        } catch (error) {
            console.error('Error in getHotDatesAnalytics:', error);
            throw error;
        }
    }

    /**
     * Get engagement funnel analytics
     */
    async getEngagementFunnelAnalytics({ venueId, from, to }) {
        const db = await this.connectDB();
        const collection = db.collection('analytics.geography.venue_clicks');

        try {
            const matchStage = {};
            
            if (venueId) {
                matchStage.venueId = venueId;
            }

            if (from || to) {
                const dateQuery = {};
                if (from) dateQuery.$gte = new Date(from);
                if (to) dateQuery.$lte = new Date(to);
                matchStage.timestamp = dateQuery;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: 1 },
                        dateFiltered: {
                            $sum: {
                                $cond: [
                                    { $ne: ['$engagement.actions.startFilterDate', null] },
                                    1,
                                    0
                                ]
                            }
                        },
                        occasionSelected: {
                            $sum: {
                                $cond: [
                                    { $ne: ['$engagement.actions.occasion', null] },
                                    1,
                                    0
                                ]
                            }
                        },
                        enquirySent: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$engagement.actions.sendEnquiryClicked', true] },
                                    1,
                                    0
                                ]
                            }
                        },
                        clickedReserved: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$engagement.actions.clickedOnReserved', true] },
                                    1,
                                    0
                                ]
                            }
                        },
                        clickedBookNow: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$engagement.actions.clickedOnBookNow', true] },
                                    1,
                                    0
                                ]
                            }
                        },
                        madePayment: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$engagement.actions.madePayment', true] },
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
                        totalViews: 1,
                        dateFiltered: 1,
                        occasionSelected: 1,
                        enquirySent: 1,
                        clickedReserved: 1,
                        clickedBookNow: 1,
                        madePayment: 1,
                        conversionRates: {
                            viewToEnquiry: {
                                $multiply: [
                                    { $divide: ['$enquirySent', { $max: ['$totalViews', 1] }] },
                                    100
                                ]
                            },
                            enquiryToReserved: {
                                $multiply: [
                                    { $divide: ['$clickedReserved', { $max: ['$enquirySent', 1] }] },
                                    100
                                ]
                            },
                            reservedToBooking: {
                                $multiply: [
                                    { $divide: ['$clickedBookNow', { $max: ['$clickedReserved', 1] }] },
                                    100
                                ]
                            },
                            bookingToPayment: {
                                $multiply: [
                                    { $divide: ['$madePayment', { $max: ['$clickedBookNow', 1] }] },
                                    100
                                ]
                            }
                        }
                    }
                }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            return result[0] || {
                totalViews: 0,
                dateFiltered: 0,
                occasionSelected: 0,
                enquirySent: 0,
                clickedReserved: 0,
                clickedBookNow: 0,
                madePayment: 0,
                conversionRates: {
                    viewToEnquiry: 0,
                    enquiryToReserved: 0,
                    reservedToBooking: 0,
                    bookingToPayment: 0
                }
            };

        } catch (error) {
            console.error('Error in getEngagementFunnelAnalytics:', error);
            throw error;
        }
    }

    /**
     * Get leads analytics with engagement data
     */
    async getLeadsAnalytics({ venueId, from, to, leadStatus, limit = 50, skip = 0, userRole }) {
        const db = await this.connectDB();
        const collection = db.collection('analytics.geography.venue_clicks');

        try {
            const matchStage = {
                $or: [
                    { userId: { $exists: true, $ne: null } },
                    { userName: { $exists: true, $ne: null } },
                    { userEmail: { $exists: true, $ne: null } }
                ]
            };
            
            if (venueId) {
                matchStage.venueId = venueId;
            }

            if (from || to) {
                const dateQuery = {};
                if (from) dateQuery.$gte = new Date(from);
                if (to) dateQuery.$lte = new Date(to);
                matchStage.timestamp = dateQuery;
            }

            // Aggregate leads with engagement data
            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            userId: '$userId',
                            userEmail: '$userEmail',
                            venueId: '$venueId'
                        },
                        userName: { $first: '$userName' },
                        userEmail: { $first: '$userEmail' },
                        userContact: { $first: '$userContact' },
                        venueName: { $first: '$venueName' },
                        totalClicks: { $sum: 1 },
                        lastVisit: { $max: '$timestamp' },
                        totalTimeSpent: { $sum: '$engagement.timeSpentSeconds' },
                        maxQualityScore: { $max: '$engagement.qualityScore' },
                        engagementActions: { $last: '$engagement.actions' },
                        // Aggregate key actions
                        sendEnquiryClicked: { 
                            $max: { $cond: [{ $eq: ['$engagement.actions.sendEnquiryClicked', true] }, 1, 0] }
                        },
                        clickedOnReserved: { 
                            $max: { $cond: [{ $eq: ['$engagement.actions.clickedOnReserved', true] }, 1, 0] }
                        },
                        clickedOnBookNow: { 
                            $max: { $cond: [{ $eq: ['$engagement.actions.clickedOnBookNow', true] }, 1, 0] }
                        },
                        madePayment: { 
                            $max: { $cond: [{ $eq: ['$engagement.actions.madePayment', true] }, 1, 0] }
                        }
                    }
                },
                {
                    $addFields: {
                        averageTimeSpent: { $divide: ['$totalTimeSpent', '$totalClicks'] },
                        leadScore: {
                            $add: [
                                { $multiply: ['$maxQualityScore', 30] }, // Quality score weight: 30%
                                { $multiply: ['$sendEnquiryClicked', 25] }, // Enquiry: 25 points
                                { $multiply: ['$clickedOnReserved', 20] }, // Reserved: 20 points
                                { $multiply: ['$clickedOnBookNow', 15] }, // Book now: 15 points
                                { $multiply: ['$madePayment', 10] }, // Payment: 10 points
                                { $min: [{ $divide: ['$totalClicks', 5] }, 10] } // Click frequency bonus: max 10 points
                            ]
                        },
                        leadStatus: {
                            $switch: {
                                branches: [
                                    {
                                        case: { 
                                            $or: [
                                                { $eq: ['$madePayment', 1] },
                                                { $and: [
                                                    { $eq: ['$clickedOnBookNow', 1] },
                                                    { $gte: ['$totalClicks', 3] }
                                                ]}
                                            ]
                                        },
                                        then: 'hot'
                                    },
                                    {
                                        case: { 
                                            $or: [
                                                { $eq: ['$clickedOnReserved', 1] },
                                                { $eq: ['$sendEnquiryClicked', 1] },
                                                { $gte: ['$totalClicks', 2] }
                                            ]
                                        },
                                        then: 'warm'
                                    }
                                ],
                                default: 'cold'
                            }
                        }
                    }
                }
            ];

            // Add lead status filter if specified
            if (leadStatus && leadStatus !== 'all') {
                pipeline.push({ $match: { leadStatus: leadStatus } });
            }

            // Add sorting and pagination
            pipeline.push(
                { $sort: { leadScore: -1, lastVisit: -1 } },
                { $skip: parseInt(skip) },
                { $limit: parseInt(limit) }
            );

            const leads = await collection.aggregate(pipeline).toArray();

            // Get total stats
            const statsPipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: 1 },
                        uniqueLeads: { $addToSet: { userId: '$userId', email: '$userEmail' } },
                        totalTimeSpent: { $sum: '$engagement.timeSpentSeconds' },
                        conversions: {
                            $sum: { $cond: [{ $eq: ['$engagement.actions.madePayment', true] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        totalViews: 1,
                        totalLeads: { $size: '$uniqueLeads' },
                        conversionRate: {
                            $multiply: [
                                { $divide: ['$conversions', { $max: ['$totalViews', 1] }] },
                                100
                            ]
                        },
                        averageTimeSpent: { $divide: ['$totalTimeSpent', '$totalViews'] }
                    }
                }
            ];

            const stats = await collection.aggregate(statsPipeline).toArray();

            // Format leads for response (hide sensitive data for venue owners)
            const formattedLeads = leads.map(lead => {
                const baseData = {
                    _id: lead._id.userId || lead._id.userEmail,
                    venueId: lead._id.venueId,
                    venueName: lead.venueName,
                    totalClicks: lead.totalClicks,
                    lastVisit: lead.lastVisit,
                    engagement: {
                        timeSpentSeconds: Math.round(lead.averageTimeSpent || 0),
                        qualityScore: lead.maxQualityScore || 0,
                        actions: {
                            sendEnquiryClicked: lead.sendEnquiryClicked === 1,
                            clickedOnReserved: lead.clickedOnReserved === 1,
                            clickedOnBookNow: lead.clickedOnBookNow === 1,
                            madePayment: lead.madePayment === 1,
                            selectedOccasion: lead.engagementActions?.occasion,
                            startFilterDate: lead.engagementActions?.startFilterDate,
                            endFilterDate: lead.engagementActions?.endFilterDate,
                            guestCount: lead.engagementActions?.guestCount,
                            foodMenuType: lead.engagementActions?.foodMenuType,
                            weddingDecorType: lead.engagementActions?.weddingDecorType
                        }
                    },
                    leadScore: Math.round(Math.min(lead.leadScore || 0, 100)),
                    leadStatus: lead.leadStatus
                };

                // Add contact info for admins only
                if (userRole === 'admin') {
                    baseData.userName = lead.userName;
                    baseData.userEmail = lead.userEmail;
                    baseData.userContact = lead.userContact;
                }

                return baseData;
            });

            return {
                leads: formattedLeads,
                stats: stats[0] || {
                    totalViews: 0,
                    totalLeads: 0,
                    conversionRate: 0,
                    averageTimeSpent: 0
                }
            };

        } catch (error) {
            console.error('Error in getLeadsAnalytics:', error);
            throw error;
        }
    }

    /**
     * Get popular dates analytics
     */
    async getPopularDatesAnalytics({ venueId, from, to, occasion }) {
        const db = await this.connectDB();
        const collection = db.collection('analytics.geography.venue_clicks');

        try {
            const matchStage = {};
            
            if (venueId) {
                matchStage.venueId = venueId;
            }

            if (from || to) {
                const dateQuery = {};
                if (from) dateQuery.$gte = from;
                if (to) dateQuery.$lte = to;
                matchStage['engagement.actions.startFilterDate'] = dateQuery;
            }

            if (occasion) {
                matchStage['engagement.actions.occasion'] = occasion;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $match: {
                        'engagement.actions.startFilterDate': { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$engagement.actions.startFilterDate',
                        popularity: { $sum: 1 },
                        occasions: { $addToSet: '$engagement.actions.occasion' },
                        averageGuestCount: {
                            $avg: {
                                $toInt: {
                                    $cond: [
                                        { $ne: ['$engagement.actions.guestCount', null] },
                                        '$engagement.actions.guestCount',
                                        0
                                    ]
                                }
                            }
                        },
                        bookingIntent: {
                            $sum: {
                                $cond: [
                                    { $or: [
                                        { $eq: ['$engagement.actions.clickedOnBookNow', true] },
                                        { $eq: ['$engagement.actions.clickedOnReserved', true] }
                                    ]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        date: '$_id',
                        occasions: { $filter: { input: '$occasions', cond: { $ne: ['$$this', null] } } }
                    }
                },
                { $sort: { popularity: -1, date: 1 } },
                { $limit: 100 } // Top 100 popular dates
            ];

            const result = await collection.aggregate(pipeline).toArray();
            
            return result.map(item => ({
                date: item.date,
                popularity: item.popularity,
                occasions: item.occasions,
                averageGuestCount: Math.round(item.averageGuestCount || 0),
                bookingIntent: item.bookingIntent
            }));

        } catch (error) {
            console.error('Error in getPopularDatesAnalytics:', error);
            throw error;
        }
    }

    /**
     * Get comprehensive venue insights dashboard
     */
    async getVenueInsightsDashboard({ venueId, from, to, userRole }) {
        try {
            const params = { venueId, from, to };
            
            const [hotDates, engagementFunnel, leads, popularDates] = await Promise.all([
                this.getHotDatesAnalytics(params),
                this.getEngagementFunnelAnalytics(params),
                this.getLeadsAnalytics({ ...params, userRole, limit: 10 }),
                this.getPopularDatesAnalytics(params)
            ]);

            return {
                venueId,
                hotDates,
                popularDates,
                engagementFunnel,
                leads: leads.leads,
                totalStats: leads.stats
            };

        } catch (error) {
            console.error('Error in getVenueInsightsDashboard:', error);
            throw error;
        }
    }

    /**
     * Get user engagement timeline
     */
    async getUserEngagementTimeline({ userId, venueId }) {
        const db = await this.connectDB();
        const collection = db.collection('analytics.geography.venue_clicks');

        try {
            const matchStage = {
                $or: [
                    { userId: userId },
                    { userEmail: userId } // In case userId is actually an email
                ]
            };
            
            if (venueId) {
                matchStage.venueId = venueId;
            }

            const pipeline = [
                { $match: matchStage },
                {
                    $project: {
                        timestamp: 1,
                        venueId: 1,
                        venueName: 1,
                        engagement: 1,
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    }
                },
                { $sort: { timestamp: 1 } }
            ];

            const timeline = await collection.aggregate(pipeline).toArray();
            
            return timeline.map(item => ({
                timestamp: item.timestamp,
                venueId: item.venueId,
                venueName: item.venueName,
                date: item.date,
                engagement: item.engagement
            }));

        } catch (error) {
            console.error('Error in getUserEngagementTimeline:', error);
            throw error;
        }
    }

    /**
     * Export analytics data to Excel/CSV
     */
    async exportAnalyticsData({ type, venueId, format = 'xlsx', userRole, ...params }) {
        try {
            let data = [];
            let headers = [];
            let sheetName = 'Analytics Data';

            switch (type) {
                case 'hot-dates':
                    data = await this.getHotDatesAnalytics({ venueId, ...params });
                    headers = ['Date', 'Booking Count', 'Enquiry Count', 'Click Count', 'Heat Intensity', 'Popular Occasions'];
                    sheetName = 'Hot Dates Analytics';
                    break;

                case 'funnel':
                    const funnelData = await this.getEngagementFunnelAnalytics({ venueId, ...params });
                    data = [funnelData];
                    headers = ['Total Views', 'Date Filtered', 'Occasion Selected', 'Enquiry Sent', 'Clicked Reserved', 'Clicked Book Now', 'Made Payment'];
                    sheetName = 'Engagement Funnel';
                    break;

                case 'leads':
                    const leadsResult = await this.getLeadsAnalytics({ venueId, userRole, limit: 1000, ...params });
                    data = leadsResult.leads;
                    headers = userRole === 'admin' 
                        ? ['Name', 'Email', 'Contact', 'Total Clicks', 'Lead Score', 'Lead Status', 'Last Visit']
                        : ['Total Clicks', 'Lead Score', 'Lead Status', 'Last Visit', 'Engagement Actions'];
                    sheetName = 'Leads Analytics';
                    break;

                case 'complete':
                    // Export all data in multiple sheets (Excel only)
                    return await this.exportCompleteReport({ venueId, userRole, ...params });

                default:
                    throw new Error(`Unknown export type: ${type}`);
            }

            if (format === 'csv') {
                return this.generateCSV(data, headers);
            } else {
                return await this.generateExcel(data, headers, sheetName);
            }

        } catch (error) {
            console.error('Error in exportAnalyticsData:', error);
            throw error;
        }
    }

    generateCSV(data, headers) {
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                // Handle the data mapping based on the header and row structure
                let value = '';
                // Add appropriate value extraction logic here
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    async generateExcel(data, headers, sheetName) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        
        // Add headers
        worksheet.addRow(headers);
        
        // Style headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        
        // Add data rows
        data.forEach(row => {
            const rowData = headers.map(header => {
                // Map data to headers appropriately
                // Add appropriate value extraction logic here
                return '';
            });
            worksheet.addRow(rowData);
        });
        
        // Auto-fit columns
        worksheet.columns.forEach(column => {
            column.width = 15;
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }

    async exportCompleteReport({ venueId, userRole, ...params }) {
        const workbook = new ExcelJS.Workbook();
        
        // Add multiple sheets with different analytics
        const [hotDates, funnel, leads, popularDates] = await Promise.all([
            this.getHotDatesAnalytics({ venueId, ...params }),
            this.getEngagementFunnelAnalytics({ venueId, ...params }),
            this.getLeadsAnalytics({ venueId, userRole, limit: 1000, ...params }),
            this.getPopularDatesAnalytics({ venueId, ...params })
        ]);
        
        // Add Hot Dates sheet
        const hotDatesSheet = workbook.addWorksheet('Hot Dates');
        hotDatesSheet.addRow(['Date', 'Booking Count', 'Enquiry Count', 'Click Count', 'Heat Intensity']);
        hotDates.forEach(item => {
            hotDatesSheet.addRow([item.date, item.bookingCount, item.enquiryCount, item.clickCount, item.heatIntensity]);
        });
        
        // Add Engagement Funnel sheet
        const funnelSheet = workbook.addWorksheet('Engagement Funnel');
        funnelSheet.addRow(['Metric', 'Count', 'Conversion Rate %']);
        funnelSheet.addRow(['Total Views', funnel.totalViews, '']);
        funnelSheet.addRow(['Date Filtered', funnel.dateFiltered, funnel.conversionRates.viewToEnquiry]);
        funnelSheet.addRow(['Enquiry Sent', funnel.enquirySent, funnel.conversionRates.enquiryToReserved]);
        funnelSheet.addRow(['Clicked Reserved', funnel.clickedReserved, funnel.conversionRates.reservedToBooking]);
        funnelSheet.addRow(['Clicked Book Now', funnel.clickedBookNow, funnel.conversionRates.bookingToPayment]);
        funnelSheet.addRow(['Made Payment', funnel.madePayment, '']);
        
        // Add Leads sheet
        const leadsSheet = workbook.addWorksheet('Leads');
        const leadsHeaders = userRole === 'admin' 
            ? ['Name', 'Email', 'Contact', 'Total Clicks', 'Lead Score', 'Lead Status', 'Last Visit']
            : ['User ID', 'Total Clicks', 'Lead Score', 'Lead Status', 'Last Visit'];
        leadsSheet.addRow(leadsHeaders);
        
        leads.leads.forEach(lead => {
            if (userRole === 'admin') {
                leadsSheet.addRow([
                    lead.userName || 'Anonymous',
                    lead.userEmail || '',
                    lead.userContact || '',
                    lead.totalClicks,
                    lead.leadScore,
                    lead.leadStatus,
                    lead.lastVisit
                ]);
            } else {
                leadsSheet.addRow([
                    lead._id,
                    lead.totalClicks,
                    lead.leadScore,
                    lead.leadStatus,
                    lead.lastVisit
                ]);
            }
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
}

module.exports = new VenueAnalyticsService();
