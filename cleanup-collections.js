const { MongoClient } = require('mongodb');
const PRODUCTION_DB_URL = 'mongodb://admin:Pass_9702@160.153.173.104:27017/admin';

async function cleanupCollections() {
    console.log('🧹 Cleaning up duplicate analytics collections...');
    
    const client = new MongoClient(PRODUCTION_DB_URL, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db('admin');
    
    const oldCollection = 'analytics.geography.venue_clicks';
    const newCollection = 'analytics.geography.venue_clicks';
    const oldInsightsCollection = 'analytics.geography.venue_insights';
    const newInsightsCollection = 'analytics.geography.venue_insights';
    
    try {
        // 1. Get all data from old collections
        console.log('📋 Migrating data from old to new collections...');
        
        const oldClicks = await db.collection(oldCollection).find().toArray();
        console.log(`Found ${oldClicks.length} venue clicks in old collection`);
        
        const oldInsights = await db.collection(oldInsightsCollection).find().toArray();
        console.log(`Found ${oldInsights.length} venue insights in old collection`);
        
        // 2. Insert into new collections (if data exists)
        if (oldClicks.length > 0) {
            // Remove duplicates based on _id
            const existingIds = await db.collection(newCollection).distinct('_id');
            const newClicks = oldClicks.filter(click => !existingIds.includes(click._id));
            
            if (newClicks.length > 0) {
                await db.collection(newCollection).insertMany(newClicks);
                console.log(`✅ Migrated ${newClicks.length} new venue clicks`);
            } else {
                console.log('ℹ️ All venue clicks already exist in new collection');
            }
        }
        
        if (oldInsights.length > 0) {
            const existingInsightIds = await db.collection(newInsightsCollection).distinct('_id');
            const newInsights = oldInsights.filter(insight => !existingInsightIds.includes(insight._id));
            
            if (newInsights.length > 0) {
                await db.collection(newInsightsCollection).insertMany(newInsights);
                console.log(`✅ Migrated ${newInsights.length} new venue insights`);
            } else {
                console.log('ℹ️ All venue insights already exist in new collection');
            }
        }
        
        // 3. Verify migration
        const finalClickCount = await db.collection(newCollection).countDocuments();
        const finalInsightCount = await db.collection(newInsightsCollection).countDocuments();
        
        console.log(`📊 Final counts in new collections:`);
        console.log(`  Venue clicks: ${finalClickCount}`);
        console.log(`  Venue insights: ${finalInsightCount}`);
        
        // 4. Drop old collections
        console.log('🗑️ Removing old collections...');
        try {
            await db.collection(oldCollection).drop();
            console.log('✅ Dropped old venue clicks collection');
        } catch (err) {
            console.log('ℹ️ Old venue clicks collection may not exist or already dropped');
        }
        
        try {
            await db.collection(oldInsightsCollection).drop();
            console.log('✅ Dropped old venue insights collection');
        } catch (err) {
            console.log('ℹ️ Old venue insights collection may not exist or already dropped');
        }
        
        // 5. Show final collection list
        console.log('\\n📋 Final analytics collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            if (col.name.includes('analytics')) {
                console.log(`  ✓ ${col.name}`);
            }
        });
        
        console.log('\\n✅ Collection cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        await client.close();
    }
}

cleanupCollections();
