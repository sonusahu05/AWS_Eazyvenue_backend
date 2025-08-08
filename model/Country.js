const mongoose = require('mongoose');
const Int32 = require("mongoose-int32").loadType(mongoose);
const Schema = mongoose.Schema;
const countrySchema = new Schema({
    //_id: Schema.Types.ObjectId,
    id: Int32,
	name:String,
    code:String,
	//iso3 : String,
    iso2 : String,
    phone_code : String,
    capital: String,
    currency: String,
    currency_symbol: String,
    tld: String,
    native: String,
    region: String,
    subregion: String,
    timezones:  [
        {
            zoneName: String,
            gmtOffset: String,
            gmtOffsetName: String,
            abbreviation: String,
            tzName: String,
        },        
    ],
    translations: [],
    latitude: String,
    longitude: String,
    emoji: String,
    emojiU: String,
    status:Boolean,
    disable: Boolean,
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date, default: Date.now },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date } 
});
module.exports = mongoose.model("countries" , countrySchema);
