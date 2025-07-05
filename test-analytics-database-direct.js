const getMongoDBClient = require('./src/db/mongodbClient');

async function testAnalyticsDatabase() {
    try {
        console.log('Testing analytics database connection...');
        
        const db = await getMongoDBClient();
        console.log('✅ Database connected successfully');
        
        // Test inserting a document
        const testDoc = {
            _id: 'test_venue_direct',
            venueId: 'test_venue_direct',
            timestamp: new Date(),
            user: {
                userId: 'test_user_direct',
                isReturning: false,
                sessionId: 'test_session_direct'
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
        
        console.log('Inserting test document...');
        const result = await db
            .collection('analytics.geography.venue_clicks')
            .insertOne(testDoc);
        
        console.log('✅ Document inserted successfully:', result.insertedId);
        
        // Query the document back
        console.log('Querying document...');
        const retrieved = await db
            .collection('analytics.geography.venue_clicks')
            .findOne({ _id: 'test_venue_direct' });
        
        console.log('✅ Document retrieved:', retrieved ? 'Found' : 'Not found');
        
        // Count all documents
        const count = await db
            .collection('analytics.geography.venue_clicks')
            .countDocuments();
        
        console.log('✅ Total documents in collection:', count);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testAnalyticsDatabase();
