const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const enquirySchema = new Schema({
    venueName: String,
    venueId: { type: Schema.Types.ObjectId, ref: "Venue" },
    userName: String,
    userContact: String,
    userEmail: String,
    created_at: { type: Date, default: Date.now },
    status: { type: String, default: 'New', enum: ['New', 'Contacted', 'Converted', 'Closed'] }
});

module.exports = mongoose.model('enquiries', enquirySchema);