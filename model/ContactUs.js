const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contactUsSchema = new Schema({
    name: String,
    email: String,
    phoneNumber: String,
    message: String,
    status: Boolean,
    disable:Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});
//add
module.exports = mongoose.model('contactus', contactUsSchema);
