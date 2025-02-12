const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Int32 = require("mongoose-int32").loadType(mongoose);
const eventplannerSchema = new Schema({
    name: String,    
    mobileNumber: String,
    eventdate: Date,
    guestcnt: Int32,
    email: String,
    status: Boolean,
    disable:Boolean,
    //created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});
//add
module.exports = mongoose.model('eventplanners', eventplannerSchema);
