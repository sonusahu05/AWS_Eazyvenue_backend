const getMongoDBClient = require('../../../db/mongodbClient');

/**
 * Migration script to move analytics data to admin.analytics.geography structure
 * This script will:
 * 1. Copy data from old collections to new admin structure
 * 2. Create necessary indexes
 * 3. Verify data integrity
 */

async function migrateToAdminStructure() {
    try {
        const db = await getMongoDBClient();
        
        console.log('🚀 Starting migration to admin.analytics.geography structure...');
        
        // Check if old collections exist
        const collections = await db.listCollections().toArray();
        const oldVenueClicks = collections.find(c => c.name === 'venue_clicks');
        const oldVenueInsights = collections.find(c => c.name === 'venue_insights');
        
        let migratedClicks = 0;
        let migratedInsights = 0;
        
        // Migrate venue_clicks to analytics.geography.venue_clicks
        if (oldVenueClicks) {
            console.log('📊 Migrating venue_clicks data...');
            
            const oldClicksData = await db.collection('venue_clicks').find({}).toArray();
            
            if (oldClicksData.length > 0) {
                await db.collection('analytics.geography.venue_clicks').insertMany(oldClicksData);
                migratedClicks = oldClicksData.length;
                console.log(`✅ Migrated ${migratedClicks} venue clicks to admin structure`);
            }
        }
        
        // Migrate venue_insights to analytics.geography.venue_insights
        if (oldVenueInsights) {
            console.log('📈 Migrating venue_insights data...');
            
            const oldInsightsData = await db.collection('venue_insights').find({}).toArray();
            
            if (oldInsightsData.length > 0) {
                await db.collection('analytics.geography.venue_insights').insertMany(oldInsightsData);
                migratedInsights = oldInsightsData.length;
                console.log(`✅ Migrated ${migratedInsights} venue insights to admin structure`);
            }
        }
        
        // Create indexes for new collections
        console.log('🔧 Creating indexes for new collections...');
        
        // Indexes for analytics.geography.venue_clicks
        await db.collection('analytics.geography.venue_clicks').createIndex({ venueId: 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ timestamp: -1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ venueId: 1, timestamp: -1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'location.city': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'device.platform': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'user.userId': 1 });
        await db.collection('analytics.geography.venue_clicks').createIndex({ 'location.pincode': 1 });
        
        // Indexes for analytics.geography.venue_insights
        await db.collection('analytics.geography.venue_insights').createIndex({ _id: 1 });
        await db.collection('analytics.geography.venue_insights').createIndex({ lastUpdated: -1 });
        
        console.log('✅ Indexes created successfully!');
        
        // Verify data integrity
        const newClicksCount = await db.collection('analytics.geography.venue_clicks').countDocuments();
        const newInsightsCount = await db.collection('analytics.geography.venue_insights').countDocuments();
        
        console.log('🔍 Data integrity verification:');
        console.log(`   - Venue Clicks: ${newClicksCount} documents in new collection`);
        console.log(`   - Venue Insights: ${newInsightsCount} documents in new collection`);
        
        // Migration summary
        const summary = {
            success: true,
            migratedClicks,
            migratedInsights,
            newClicksCount,
            newInsightsCount,
            timestamp: new Date()
        };
        
        console.log('🎉 Migration completed successfully!');
        console.log('Summary:', JSON.stringify(summary, null, 2));
        
        return summary;
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

async function cleanupOldCollections() {
    try {
        const db = await getMongoDBClient();
        
        console.log('🧹 Cleaning up old collections...');
        
        // Drop old collections after successful migration
        const collections = await db.listCollections().toArray();
        
        if (collections.find(c => c.name === 'venue_clicks')) {
            await db.collection('venue_clicks').drop();
            console.log('✅ Dropped old venue_clicks collection');
        }
        
        if (collections.find(c => c.name === 'venue_insights')) {
            await db.collection('venue_insights').drop();
            console.log('✅ Dropped old venue_insights collection');
        }
        
        console.log('🎉 Cleanup completed!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Export functions for use in other scripts
module.exports = {
    migrateToAdminStructure,
    cleanupOldCollections
};

// Run migration if script is executed directly
if (require.main === module) {
    migrateToAdminStructure()
        .then((summary) => {
            console.log('Migration completed successfully:', summary);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}
