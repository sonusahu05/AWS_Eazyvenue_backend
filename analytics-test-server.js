#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Simple test server to test analytics API endpoints
// Data will be stored in admin.analytics.geography collections in production
const app = express();
const port = 3007;
app.use(express.json());
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Mock data store
let clicksData = [];
let insightsData = {};

// Mock analytics endpoints
app.post('/api/analytics/geography/track-venue-click', (req, res) => {
    try {
        const {
            venueId,
            location,
            device,
            engagement,
            userId,
            sessionId
        } = req.body;

        // Basic validation
        if (!venueId || !sessionId) {
            return res.status(400).json({
                success: false,
                error: 'venueId and sessionId are required'
            });
        }

        // Calculate mock quality score
        const timeScore = Math.min((engagement?.timeSpentSeconds || 0) / 60, 1);
        const scrollScore = (engagement?.scrollDepthPercent || 0) / 100;
        const enquiryScore = engagement?.submittedEnquiry ? 1 : 0;
        const qualityScore = Math.round(((timeScore * 0.4) + (scrollScore * 0.3) + (enquiryScore * 0.3)) * 100) / 100;

        const clickData = {
            id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            venueId,
            timestamp: new Date(),
            user: {
                userId: userId || null,
                isReturning: Math.random() > 0.8, // Mock returning user detection
                sessionId
            },
            location: location || {},
            device: device || {},
            engagement: engagement || {},
            qualityScore
        };

        clicksData.push(clickData);

        console.log(`✅ Venue click tracked: ${venueId} (Quality Score: ${qualityScore})`);

        res.status(201).json({
            success: true,
            message: 'Venue interest tracked successfully',
            data: {
                id: clickData.id,
                venueId: venueId,
                timestamp: clickData.timestamp,
                qualityScore: qualityScore
            }
        });

    } catch (error) {
        console.error(`❌ Error tracking venue click: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to track venue interest',
            message: error.message
        });
    }
});

// Mock insights generation
app.post('/api/analytics/geography/update-venue-insights', (req, res) => {
    try {
        console.log('🔄 Generating mock venue insights...');

        const venueIds = [...new Set(clicksData.map(click => click.venueId))];
        let successful = 0;
        let failed = 0;
        const results = [];

        venueIds.forEach(venueId => {
            try {
                const venueClicks = clicksData.filter(click => click.venueId === venueId);
                
                if (venueClicks.length === 0) {
                    results.push({ venueId, success: false, error: 'No clicks found' });
                    failed++;
                    return;
                }

                // Generate mock insights
                const cityStats = {};
                const deviceStats = { mobile: 0, desktop: 0, tablet: 0 };
                const pincodeStats = {};
                let totalQualityScore = 0;

                venueClicks.forEach(click => {
                    // City stats
                    if (click.location?.city) {
                        cityStats[click.location.city] = (cityStats[click.location.city] || 0) + 1;
                    }

                    // Device stats
                    if (click.device?.isMobile) {
                        deviceStats.mobile++;
                    } else {
                        deviceStats.desktop++;
                    }

                    // Pincode stats
                    if (click.location?.pincode) {
                        pincodeStats[click.location.pincode] = (pincodeStats[click.location.pincode] || 0) + 1;
                    }

                    totalQualityScore += click.qualityScore || 0;
                });

                const insights = {
                    _id: venueId,
                    totalClicks: venueClicks.length,
                    averageQualityScore: Math.round((totalQualityScore / venueClicks.length) * 100) / 100,
                    cityStats: Object.entries(cityStats).map(([city, clicks]) => ({ city, clicks })),
                    deviceStats,
                    topPincodes: Object.entries(pincodeStats).map(([pincode, count]) => ({ pincode, count }))
                        .sort((a, b) => b.count - a.count).slice(0, 5),
                    lastUpdated: new Date()
                };

                insightsData[venueId] = insights;
                results.push({ venueId, success: true, insight: 'Generated' });
                successful++;

            } catch (error) {
                results.push({ venueId, success: false, error: error.message });
                failed++;
            }
        });

        console.log(`✅ Insights generated for ${successful}/${venueIds.length} venues`);

        res.json({
            success: true,
            message: 'Venue insights updated successfully',
            data: {
                totalProcessed: venueIds.length,
                successful,
                failed,
                results
            }
        });

    } catch (error) {
        console.error(`❌ Error updating venue insights: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to update venue insights',
            message: error.message
        });
    }
});

// Get venue insights
app.get('/api/analytics/geography/venue-insights/:venueId', (req, res) => {
    try {
        const { venueId } = req.params;
        
        if (!venueId) {
            return res.status(400).json({
                success: false,
                error: 'venueId is required'
            });
        }

        const insights = insightsData[venueId];
        
        if (!insights) {
            return res.status(404).json({
                success: false,
                error: 'No insights found for this venue',
                message: 'Try updating insights first or ensure the venue has received clicks'
            });
        }

        res.json({
            success: true,
            data: insights
        });

    } catch (error) {
        console.error(`❌ Error getting venue insights: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to get venue insights',
            message: error.message
        });
    }
});

// Get analytics summary
app.get('/api/analytics/geography/summary', (req, res) => {
    try {
        const summary = {
            totalClicks: clicksData.length,
            totalInsights: Object.keys(insightsData).length,
            totalVenues: [...new Set(clicksData.map(click => click.venueId))].length,
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error(`❌ Error getting analytics summary: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to get analytics summary',
            message: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Analytics API Test Server is running',
        timestamp: new Date(),
        endpoints: [
            'POST /api/analytics/geography/track-venue-click',
            'POST /api/analytics/geography/update-venue-insights',
            'GET /api/analytics/geography/venue-insights/:venueId',
            'GET /api/analytics/geography/summary'
        ]
    });
});


// Define the /api/aisearch POST route
app.post('/api/aisearch', (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ success: false, error: 'No prompt provided' });
  }

  // Dummy AI suggestion logic — replace with your own
  const suggestion = `You asked for: "${prompt}". Here is a suggestion based on venues.`;

  res.json({ success: true, suggestion });
});



// Start server
app.listen(port, () => {
    console.log(`🚀 Analytics API Test Server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📝 Ready to test analytics endpoints!`);
});

module.exports = app;
