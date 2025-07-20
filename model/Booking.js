const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    venueId: {
        type: String,
        required: true,
        index: true
    },
    venueName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userContact: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    details: {
        isBookedByAdmin: {
            type: Boolean,
            default: false
        },
        startFilterDate: {
            type: String,
            required: true
        },
        endFilterDate: {
            type: String,
            required: true
        },
        eventDuration: {
            type: String,
            enum: ['morning', 'evening', 'night', 'full', null],
            default: null
        },
        occasion: {
            type: String,
            required: true
        },
        weddingDecorType: {
            type: String,
            enum: ['Basic', 'Standard', 'Premium', null],
            default: null
        },
        weddingDecorPrice: {
            type: Number,
            default: 0
        },
        foodMenuType: {
            type: String,
            default: null
        },
        foodMenuPrice: {
            type: Number,
            default: 0
        },
        foodMenuPlate: {
            type: String,
            enum: ['1x1', '2x2', '3x3', null],
            default: null
        },
        guestCount: {
            type: String,
            required: true
        },
        // Analytics tracking fields
        sendEnquiryClicked: {
            type: Boolean,
            default: false
        },
        clickedOnReserved: {
            type: Boolean,
            default: false
        },
        clickedOnBookNow: {
            type: Boolean,
            default: false
        },
        madePayment: {
            type: Boolean,
            default: false
        },
        // Additional booking details
        bookingType: {
            type: String,
            enum: ['online', 'offline', 'maintenance', 'blocked'],
            default: 'online'
        },
        bookingNotes: {
            type: String,
            default: ''
        },
        totalAmount: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'refunded', 'not_applicable'],
            default: 'pending'
        },
        bookingStatus: {
            type: String,
            enum: ['confirmed', 'pending', 'cancelled', 'completed'],
            default: 'pending'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedBy: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'bookings'
});

// Indexes for better performance
bookingSchema.index({ venueId: 1, 'details.startFilterDate': 1 });
bookingSchema.index({ venueId: 1, 'details.endFilterDate': 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ 'details.isBookedByAdmin': 1 });
bookingSchema.index({ 'details.bookingType': 1 });
bookingSchema.index({ 'details.bookingStatus': 1 });

// Pre-save middleware to update timestamp
bookingSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
