const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const enquirySchema = new Schema({
    venueName: { 
        type: String,
        required: true 
    },
    venueId: { 
        type: String, 
        required: true 
    },
    userName: { 
        type: String, 
        required: true 
    },
    userContact: { 
        type: Number,
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
        enum: ['New', 'WhatsApp Contacted', 'Phone Contacted', 'Closed']
    }
});

// Add indexes for better performance
enquirySchema.index({ venueId: 1, userContact: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ created_at: -1 });

// Use 'Enquiry' as model name - Mongoose will pluralize to 'enquiries'
module.exports = mongoose.model('Enquiry', enquirySchema);