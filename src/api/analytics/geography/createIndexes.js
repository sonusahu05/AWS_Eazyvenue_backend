const getMongoDBClient = require('../../../db/mongodbClient');

async function createAnalyticsIndexes() {
    try {
        const db = await getMongoDBClient();
        
        console.log('Creating indexes for analytics.geography.venue_clicks collection...');
        
        // Create indexes for analytics.geography.venue_clicks collection
        await db.collection('analytics.geography.venue_clicks').createIndex({ venueId: 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ timestamp: -1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ venueId: 1, timestamp: -1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'location.city': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'device.platform': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'user.userId': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'location.pincode': 1 });
        
        console.log('Creating indexes for analytics.geography.venue_insights collection...');
        
        // Create indexes for analytics.geography.venue_insights collection
        await db.collection('analytics.geography.venue_insights').createIndex({ _id: 1 });
        await db.collection('analytics.geography.venue_insights').createIndex({ lastUpdated: -1 });
        
        console.log('Analytics Geography indexes created successfully!');
        
        return {
            success: true,
            message: 'All analytics geography indexes created successfully'
        };
        
    } catch (error) {
        console.error('Error creating analytics geography indexes:', error);
        throw error;
    }
}

module.exports = {
    createAnalyticsIndexes
};
