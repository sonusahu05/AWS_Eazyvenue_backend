#!/usr/bin/env node

// Simple script to demonstrate where data would be stored in MongoDB
console.log('🔍 EazyVenue Analytics - MongoDB Data Location Guide');
console.log('=====================================\n');

console.log('📊 Your MongoDB Configuration (from config/local.js):');
console.log('- Database: eazyvenue_test');
console.log('- URL: mongodb://localhost:27017/eazyvenue_test\n');

console.log('📁 Collections that would be created:');
console.log('1. venue_clicks - Raw click data');
console.log('2. venue_insights - Aggregated analytics\n');

console.log('🔧 To view data in MongoDB Compass:');
console.log('1. Install MongoDB: brew install mongodb-community');
console.log('2. Start MongoDB: brew services start mongodb-community');
console.log('3. Start EazyVenue server: npm start');
console.log('4. Connect MongoDB Compass to: mongodb://localhost:27017');
console.log('5. Select database: eazyvenue_test');
console.log('6. View collections: venue_clicks, venue_insights\n');

console.log('📊 Sample Data Structure:');
console.log('\nvenue_clicks collection:');
console.log(JSON.stringify({
  "_id": "ObjectId(...)",
  "venueId": "VENUE123",
  "timestamp": "2025-07-05T10:30:00.000Z",
  "user": {
    "userId": "USER789",
    "sessionId": "session_abc123",
    "isReturning": true
  },
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "lat": 19.0728,
    "lng": 72.8826,
    "pincode": "400001"
  },
  "device": {
    "platform": "iOS",
    "browser": "Safari",
    "isMobile": true
  },
  "engagement": {
    "timeSpentSeconds": 45,
    "scrollDepthPercent": 80,
    "submittedEnquiry": false
  },
  "qualityScore": 0.76
}, null, 2));

console.log('\nvenue_insights collection:');
console.log(JSON.stringify({
  "_id": "VENUE123",
  "totalClicks": 150,
  "averageQualityScore": 0.68,
  "cityStats": [
    {"city": "Mumbai", "clicks": 80},
    {"city": "Delhi", "clicks": 45},
    {"city": "Bangalore", "clicks": 25}
  ],
  "deviceStats": {
    "mobile": 90,
    "desktop": 50,
    "tablet": 10
  },
  "heatmapPoints": [
    {"lat": 19.0728, "lng": 72.8826, "count": 15}
  ],
  "timeline": [
    {"date": "2025-07-05", "clicks": 35}
  ],
  "topPincodes": [
    {"pincode": "400001", "count": 19}
  ],
  "lastUpdated": "2025-07-05T15:30:00.000Z"
}, null, 2));

console.log('\n🎯 Current Status:');
console.log('- ✅ Analytics API implemented');
console.log('- ✅ Test server working (in-memory data)');
console.log('- ❌ MongoDB not connected');
console.log('- ❌ Real server not started\n');

console.log('🚀 Next Steps:');
console.log('1. Install MongoDB to see real data');
console.log('2. Or continue testing with the mock server');
console.log('3. Integrate tracking calls in frontend\n');
