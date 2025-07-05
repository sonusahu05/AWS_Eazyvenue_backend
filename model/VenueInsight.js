const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const venueInsightSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    heatmapPoints: [{
        lat: Number,
        lng: Number,
        count: Number
    }],
    cityStats: [{
        city: String,
        clicks: Number
    }],
    deviceStats: {
        mobile: { type: Number, default: 0 },
        desktop: { type: Number, default: 0 },
        tablet: { type: Number, default: 0 }
    },
    timeline: [{
        date: String,
        clicks: Number
    }],
    topPincodes: [{
        pincode: String,
        count: Number
    }],
    totalClicks: {
        type: Number,
        default: 0
    },
    averageQualityScore: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'analytics.geography.venue_insights' // Store in admin/analytics/geography structure
});

module.exports = mongoose.model('VenueInsight', venueInsightSchema, 'analytics.geography.venue_insights');
