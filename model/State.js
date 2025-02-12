
const mongoose = require('mongoose');
const Int32 = require("mongoose-int32").loadType(mongoose);
const Schema = mongoose.Schema;
const stateSchema = new Schema({
    name:String,
    //country_id: {type: Schema.Types.ObjectId, ref: "Country"},
    country_id: Int32,
    country_code: String,
	state_code : String,
    status:{type:Boolean, default: true},
    disable:{type:Boolean, default: true},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date, default: Date.now },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date } 
});
module.exports = mongoose.model('states', stateSchema);
