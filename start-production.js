// Temporary production database configuration override
process.env.NODE_CONFIG = JSON.stringify({
    db: {
        url: "mongodb://admin:Pass_9702@160.153.173.104:27017/admin",
        name: "admin"
    }
});

console.log('🚀 Starting EazyVenue server with PRODUCTION database...');
console.log('📋 Database: mongodb://admin:***@160.153.173.104:27017/admin');

// Start the main app
require('./src/app');
