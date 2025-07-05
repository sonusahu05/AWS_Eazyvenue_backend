const { MongoClient } = require('mongodb');

// Production database connection
const PRODUCTION_DB_URL = "mongodb://admin:Pass_9702@160.153.173.104:27017/admin";
const DB_NAME = "admin";

async function testProductionDatabase() {
    console.log('🔗 Connecting to PRODUCTION Database...');
    console.log('URL:', PRODUCTION_DB_URL.replace(/:[^:@]+@/, ':***@'));
    console.log('Database:', DB_NAME);
    
    let client;
    try {
        // Connect to production database
        client = new MongoClient(PRODUCTION_DB_URL, { 
            useUnifiedTopology: true, 
            useNewUrlParser: true 
        });
        
        await client.connect();
        console.log('✅ Connected to production database successfully!');
        
        const db = client.db(DB_NAME);
        
        // List all collections to see what exists
        console.log('\n📋 All Collections in Production DB:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        // Check if analytics collections exist
        console.log('\n🔍 Checking Analytics Collections:');
        const venueClicksCollection = 'analytics.geography.venue_clicks';
        const venueInsightsCollection = 'analytics.geography.venue_insights';
        
        const clicksExist = collections.some(col => col.name === venueClicksCollection);
        const insightsExist = collections.some(col => col.name === venueInsightsCollection);
        
        console.log(`  ${venueClicksCollection}: ${clicksExist ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log(`  ${venueInsightsCollection}: ${insightsExist ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (clicksExist) {
            const count = await db.collection(venueClicksCollection).countDocuments();
            console.log(`  📊 Venue Clicks Count: ${count}`);
        }
        
        if (insightsExist) {
            const count = await db.collection(venueInsightsCollection).countDocuments();
            console.log(`  📊 Venue Insights Count: ${count}`);
        }
        
        // Test inserting a new document to production
        console.log('\n🧪 Testing Insert to Production Database...');
        const testDoc = {
            _id: `prod_test_${Date.now()}`,
            venueId: 'production_test_venue',
            timestamp: new Date(),
            user: {
                userId: 'production_test_user',
                isReturning: false,
                sessionId: 'production_test_session'
            },
            location: {
                lat: null,
                lng: null,
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                pincode: null
            },
            device: {
                userAgent: null,
                platform: null,
                browser: 'Chrome',
                isMobile: false
            },
            engagement: {
                timeSpentSeconds: 0,
                scrollDepthPercent: 0,
                submittedEnquiry: false
            },
            qualityScore: 0
        };
        
        const insertResult = await db.collection(venueClicksCollection).insertOne(testDoc);
        console.log(`✅ Inserted test document: ${insertResult.insertedId}`);
        
        // Verify the insertion
        const newCount = await db.collection(venueClicksCollection).countDocuments();
        console.log(`📊 New total count: ${newCount}`);
        
        // Show recent documents
        console.log('\n📝 Recent Documents:');
        const recent = await db.collection(venueClicksCollection)
            .find()
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();
        
        recent.forEach((doc, index) => {
            console.log(`  ${index + 1}. ${doc.venueId} | ${doc.user?.userId} | ${doc.timestamp}`);
        });
        
        console.log('\n✅ Production database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error connecting to production database:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

testProductionDatabase();
