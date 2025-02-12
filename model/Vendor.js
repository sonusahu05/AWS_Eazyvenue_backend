const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const vendorSchema = new mongoose.Schema({
    name: String,
    email:String,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    images:[
        {
            vendor_image: String,
            alt: String,
            default: Boolean
        }
    ],
    categories: [
        {
            id:String,
            name: String
        }
    ],
    contact: String,
    state:{
        id:{ type: Schema.Types.ObjectId, ref: "State" },
        name:String,
    },
    city:{
        id:{ type: Schema.Types.ObjectId, ref: "City" },
        name:String
    },
    subarea:{
        id:{ type: Schema.Types.ObjectId, ref: "Subarea" },
        name:String
    },
    zipcode: String,
    latitude: String,
    longitude: String,
    googleRating: {
        type: Number,
        default: 4
    },
    eazyvenueRating: {
        type: Number,
        default: 4
    },
    services:[
        {
            name:String,
            price:String,
            actualPrice:Number,
            fullDayPrice:Number,
            hours4Price:Number,
            hours8Price:Number,
            hours12Price:Number,
            slug:{
                type:String,
                default:""
            }
        }
    ],
    slotServices:{},
    otherServices:{},
    deal:String,
    availableInCities:[
        {
            cityid:{ type: Schema.Types.ObjectId, ref: "City" },
            cityname:String,
        }
    ],
    responseTime:String,
    workExperience:String,
    shortDescription:String,
    longDescription:String,
    status: {
        type: Boolean,
        default: true
    },
    disable:{
        type: Boolean,
        default: false
    },
    metaUrl:String,
    metaDescription: String,
    metaKeywords: String,
    peopleBooked: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    minVendorPrice: {
        type: Number,
        default: 0
    },
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date },
});
module.exports = mongoose.model("vendors", vendorSchema);