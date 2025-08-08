const mongoose = require('mongoose');
const Int32 = require("mongoose-int32").loadType(mongoose);
const Schema = mongoose.Schema;
const subareaSchema = new Schema({    
	name: String,
    state_id: Int32,
    city_id: {type: Schema.Types.ObjectId, ref: "City"},
    status:{type:Boolean, default: true},
    disable:{type:Boolean, default: true},
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date } 
});
module.exports = mongoose.model('subareaes', subareaSchema);
