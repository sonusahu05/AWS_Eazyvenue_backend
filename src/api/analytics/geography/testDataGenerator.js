const AnalyticsService = require('./analyticsService');

class AnalyticsTestData {
    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    generateRandomLocation() {
        const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
        const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'];
        const pincodes = ['400001', '110001', '560001', '600001', '700001', '500001', '411001', '380001'];
        
        const randomIndex = Math.floor(Math.random() * cities.length);
        
        return {
            lat: 19.0760 + (Math.random() - 0.5) * 0.1, // Around Mumbai coordinates
            lng: 72.8777 + (Math.random() - 0.5) * 0.1,
            city: cities[randomIndex],
            state: states[randomIndex],
            country: 'India',
            pincode: pincodes[randomIndex]
        };
    }

    generateRandomDevice() {
        const platforms = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'];
        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
            'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
        ];

        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const isMobile = platform === 'iOS' || platform === 'Android';

        return {
            userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
            platform,
            browser: browsers[Math.floor(Math.random() * browsers.length)],
            isMobile
        };
    }

    generateRandomEngagement() {
        return {
            timeSpentSeconds: Math.floor(Math.random() * 300) + 10, // 10-310 seconds
            scrollDepthPercent: Math.floor(Math.random() * 100) + 1, // 1-100%
            submittedEnquiry: Math.random() < 0.15 // 15% chance of enquiry
        };
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    async generateTestClicks(venueId, numberOfClicks = 100) {
        try {
            console.log(`Generating ${numberOfClicks} test clicks for venue: ${venueId}`);
            
            const clicks = [];
            const userIds = Array.from({length: 20}, (_, i) => `user_${i + 1}`);
            
            for (let i = 0; i < numberOfClicks; i++) {
                const trackingData = {
                    venueId,
                    location: this.generateRandomLocation(),
                    device: this.generateRandomDevice(),
                    engagement: this.generateRandomEngagement(),
                    userId: Math.random() < 0.7 ? userIds[Math.floor(Math.random() * userIds.length)] : null, // 70% logged in users
                    sessionId: this.generateSessionId()
                };

                try {
                    await this.analyticsService.trackVenueInterest(trackingData);
                    clicks.push(trackingData);
                    
                    if ((i + 1) % 10 === 0) {
                        console.log(`Generated ${i + 1}/${numberOfClicks} clicks`);
                    }
                } catch (error) {
                    console.error(`Error generating click ${i + 1}:`, error.message);
                }
            }

            console.log(`Successfully generated ${clicks.length} test clicks for venue: ${venueId}`);
            return clicks;
        } catch (error) {
            throw new Error(`Failed to generate test clicks: ${error.message}`);
        }
    }

    async generateTestDataForMultipleVenues(venueIds, clicksPerVenue = 50) {
        try {
            console.log(`Generating test data for ${venueIds.length} venues...`);
            
            const results = [];
            
            for (const venueId of venueIds) {
                try {
                    const clicks = await this.generateTestClicks(venueId, clicksPerVenue);
                    results.push({ venueId, clicks: clicks.length, success: true });
                } catch (error) {
                    results.push({ venueId, clicks: 0, success: false, error: error.message });
                }
            }

            // Generate insights for all venues
            console.log('Generating insights for all venues...');
            await this.analyticsService.updateAllVenueInsights();

            console.log('Test data generation completed!');
            return results;
        } catch (error) {
            throw new Error(`Failed to generate test data for multiple venues: ${error.message}`);
        }
    }
}

module.exports = AnalyticsTestData;
