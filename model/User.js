const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let User = require('../model/User');
let Role = require('../model/UserRole');
const Int32 = require("mongoose-int32").loadType(mongoose);
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    fullName: String,
    role: { type: Schema.Types.ObjectId, ref: "Role" },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Category'
    },
    portfolioImage: [
        {
            venue_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    age: String,
    passwordStr: String,
    salt: String,
    passwordHash: String,
    status: Boolean,
    disable: Boolean,
    mobileNumber: String,
    address: String,
    countryname: String,
    countrycode: String,
    statename: String,
    statecode: Int32,
    cityname: String,
    citycode: String,
    zipcode: String,
    gender: String,
    dob: Date,
    profilepic: String,
    timeZone: String,
    timeZoneOffset: String,
    otp:Number,
    otpExpire:Date,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date },
});
module.exports = mongoose.model("users", userSchema);