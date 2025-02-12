const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Int32 = require("mongoose-int32").loadType(mongoose);
const venueSchema = new mongoose.Schema({
    name: String,
    email: String,
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    venueImage: [
        {
            venue_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    decor1Image: [
        {
            venue_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    decor2Image: [
        {
            venue_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    decor3Image: [
        {
            venue_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    venuePrice: Int32,
    minPrice: Int32,
    maxPrice: Int32,
    decor1Price: Int32,
    decor2Price: Int32,
    decor3Price: Int32,
    venueVideo: String,
    category: [],
    propertyType: [],
    roomData: [],
    foodMenuType: {},
    foodType: [],

    shortdescription: String,
    description: String,
    mobileNumber: String,
    capacity: Int32,
    area: Int32,
    roundTable: Int32,
    theaterSitting: Int32,
    acdetails: String,
    kitchendetails: String,
    decorationdetails: String,
    amenities: String,
    parkingdetails: String,
    capacityDescription: String,
    address: String,
    countrycode: String,
    statename: String,
    statecode: Int32,
    cityname: String,
    // citycode: { type: Schema.Types.ObjectId, ref: "City" },
    citycode: String,
    subareaid: { type: Schema.Types.ObjectId, ref: "Subarea" },
    zipcode: String,
    latitude: String,
    longitude: String,
    status: {
        type: Boolean,
        default: true
    },
    disable: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean
    },
    assured: {
        type: Boolean
    },
    googleRating: {
        type: Number,
        default: 4,
    },
    eazyVenueRating: {
        type: Number,
        default: 4
    },
    peopleBooked: {
        type: Number,
        default: 0
    },
    venuePrice: {
        type: Number,
        default: 0
    },
    minRevenue: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    metaUrl:String,
    metaDescription: String,
    metaKeywords: String,
    slot: { type: Schema.Types.ObjectId, ref: 'Slot' },
    bookingPrice: Int32,
    couponCode: String,
    isSwimmingPool: { type: Boolean, default: false },
    isParking: { type: Boolean, default: false },
    isAC: { type: Boolean, default: false },
    isGreenRooms: { type: Boolean, default: false },
    isPowerBackup: { type: Boolean, default: false },
    isDJ: { type: Boolean, default: false },
    isEntertainmentLicense: { type: Boolean, default: false },
    isPrivateParties: { type: Boolean, default: false },
    isWaiterService: { type: Boolean, default: false },
    isVIPSection: { type: Boolean, default: false },
    isRooms: { type: Boolean, default: false },
    isPillarFree: { type: Boolean, default: false },
    cancellationDescription: String,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date },
});
module.exports = mongoose.model("venues", venueSchema);