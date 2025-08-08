const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let User = require('../model/User');

const slotSchema = new Schema({
    slot: String,
    description: String,
    status: Boolean,
    disable: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});

module.exports = mongoose.model('slots', slotSchema);