const config = require('config');
const getMongoDBClient = require('./src/db/mongodbClient');

async function checkDatabaseConnection() {
    try {
        console.log('🔍 Database Connection Analysis');
        console.log('==============================');
        
        // Show config
        const dbConfig = config.get('db');
        console.log('📋 Configuration:');
        console.log(`  URL: ${dbConfig.url}`);
        console.log(`  Name: ${dbConfig.name}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
        
        // Connect and check actual database
        const db = await getMongoDBClient();
        const adminResult = await db.admin().serverStatus();
        
        console.log('\n🏪 Actual Database Connection:');
        console.log(`  Connected to: ${adminResult.host}`);
        console.log(`  Database Name: ${db.databaseName}`);
        
        // Test the analytics collections
        const venueClicksCount = await db.collection('analytics.geography.venue_clicks').countDocuments();
        console.log(`\n📊 Analytics Data:`);
        console.log(`  Venue Clicks: ${venueClicksCount} documents`);
        
        // Show some recent venue clicks
        if (venueClicksCount > 0) {
            console.log('\n📝 Recent Venue Clicks:');
            const recentClicks = await db.collection('analytics.geography.venue_clicks')
                .find()
                .sort({ timestamp: -1 })
                .limit(5)
                .toArray();
            
            recentClicks.forEach((click, index) => {
                console.log(`  ${index + 1}. ${click.venueId} | ${click.user?.userId} | ${click.timestamp?.toISOString()}`);
            });
        }
        
        console.log('\n✅ Analysis completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDatabaseConnection();
