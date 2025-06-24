const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const enquirySchema = new Schema({
    venueName: { 
        type: String, 
        required: true 
    },
    venueId: { 
        type: String,  // Changed from ObjectId to String to match frontend
        required: true 
    },
    userName: { 
        type: String, 
        required: true 
    },
    userContact: { 
        type: Number,  // Changed from String to Number to match frontend
        required: true 
    },
    userEmail: { 
        type: String,
        required: false 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        default: 'New', 
        enum: ['New', 'Contacted', 'Converted', 'Closed'] 
    }
});

// Use 'Enquiry' as model name - Mongoose will pluralize to 'enquiries'
module.exports = mongoose.model('Enquiry', enquirySchema);