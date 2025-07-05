const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const venueClickSchema = new Schema({
    venueId: {
        type: String,
        required: true,
        index: true
    },
    venueName: {
        type: String,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    user: {
        userId: {
            type: String,
            index: true
        },
        userName: {
            type: String,
            index: true
        },
        userEmail: String,
        userContact: String,
        isReturning: {
            type: Boolean,
            default: false
        },
        sessionId: {
            type: String,
            required: true
        }
    },
    location: {
        lat: Number,
        lng: Number,
        city: {
            type: String,
            index: true
        },
        state: String,
        country: String,
        pincode: {
            type: String,
            index: true
        }
    },
    device: {
        userAgent: String,
        platform: {
            type: String,
            index: true
        },
        browser: String,
        isMobile: Boolean
    },
    engagement: {
        timeSpentSeconds: {
            type: Number,
            default: 0
        },
        scrollDepthPercent: {
            type: Number,
            default: 0
        },
        submittedEnquiry: {
            type: Boolean,
            default: false
        }
    },
    qualityScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'analytics.geography.venue_clicks' // Store in admin/analytics/geography structure
});

// Compound indexes for performance
venueClickSchema.index({ venueId: 1, timestamp: -1 });
venueClickSchema.index({ 'location.city': 1 });
venueClickSchema.index({ 'device.platform': 1 });
venueClickSchema.index({ 'user.userId': 1 });

module.exports = mongoose.model('VenueClick', venueClickSchema, 'analytics.geography.venue_clicks');
