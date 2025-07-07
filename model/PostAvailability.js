const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let User = require('../model/User');

const postAvailabilitySchema = new Schema({
    slotdate: Date,
    slotenddate: Date,
    slotday: String,
    venueId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Venue'
    },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot" },
    recurring: Boolean,
    status: Boolean,
    disable: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});

module.exports = mongoose.model('postavailability', postAvailabilitySchema);