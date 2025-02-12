const mongoose = require('mongoose');
const Int32 = require("mongoose-int32").loadType(mongoose);
const Schema = mongoose.Schema;
const citySchema = new Schema({
    //_id: Schema.Types.ObjectId,
    //id: Int32,
	name: String,
    state_id: Int32,
    state_code: String,
    country_id: Int32,
    // state_id: {type: Schema.Types.ObjectId, ref: "State"},
    status:{type:Boolean, default: true},
    disable:{type:Boolean, default: true},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date } 
});
module.exports = mongoose.model('cities', citySchema);
