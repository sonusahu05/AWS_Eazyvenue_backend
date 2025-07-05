const getMongoDBClient = require('./src/db/mongodbClient');

async function comprehensiveAnalyticsTest() {
    try {
        console.log('🔍 Comprehensive Analytics Database Test');
        console.log('=====================================');
        
        const db = await getMongoDBClient();
        console.log('✅ Database connected successfully');
        
        // List all collections
        console.log('\n📋 All Collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            if (col.name.includes('analytics') || col.name.includes('venue')) {
                console.log(`  ✓ ${col.name}`);
            }
        });
        
        // Check analytics collections specifically
        const venueClicksCollection = 'analytics.geography.venue_clicks';
        const venueInsightsCollection = 'analytics.geography.venue_insights';
        
        console.log(`\n📊 Venue Clicks Collection: ${venueClicksCollection}`);
        const clickCount = await db.collection(venueClicksCollection).countDocuments();
        console.log(`  Documents: ${clickCount}`);
        
        if (clickCount > 0) {
            console.log('  Sample documents:');
            const samples = await db.collection(venueClicksCollection).find().limit(3).toArray();
            samples.forEach((doc, index) => {
                console.log(`    ${index + 1}. ID: ${doc._id}, Venue: ${doc.venueId}, Time: ${doc.timestamp}`);
            });
        }
        
        console.log(`\n📈 Venue Insights Collection: ${venueInsightsCollection}`);
        const insightCount = await db.collection(venueInsightsCollection).countDocuments();
        console.log(`  Documents: ${insightCount}`);
        
        // Test a new insertion
        console.log('\n🧪 Testing New Insertion...');
        const testDoc = {
            _id: `test_comprehensive_${Date.now()}`,
            venueId: 'comprehensive_test_venue',
            timestamp: new Date(),
            user: {
                userId: 'comprehensive_test_user',
                isReturning: false,
                sessionId: 'comprehensive_test_session'
            },
            location: {
                city: 'Test City',
                state: 'Test State',
                country: 'India'
            }
        };
        
        const insertResult = await db.collection(venueClicksCollection).insertOne(testDoc);
        console.log(`  ✅ Inserted: ${insertResult.insertedId}`);
        
        // Verify insertion
        const newCount = await db.collection(venueClicksCollection).countDocuments();
        console.log(`  📊 New count: ${newCount}`);
        
        // Show database stats
        console.log('\n📈 Database Stats:');
        const stats = await db.stats();
        console.log(`  Database: ${stats.db}`);
        console.log(`  Collections: ${stats.collections}`);
        console.log(`  Documents: ${stats.objects}`);
        console.log(`  Data Size: ${Math.round(stats.dataSize / 1024 / 1024 * 100) / 100} MB`);
        
        console.log('\n✅ Comprehensive test completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

comprehensiveAnalyticsTest();
