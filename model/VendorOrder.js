const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vendorOrderSchema = new mongoose.Schema({
    customerId: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    vendorId: {
        type: Schema.Types.ObjectId, ref: "Vendor"
    },
    vendorCategoryId:{
        type: Schema.Types.ObjectId, ref: 'Category' 
    },
    orderType:{
        type: String,
        enum: ['enquiry', 'scheduledmeeting', 'order', 'cancelled']
    },
    occasionId: {
        type: Schema.Types.ObjectId, ref:"Category"
    },
    duration: {
        occasionStartDate: Date,
        occasionEndDate: Date
    },
    timeSlot: {
        name: String,
        slug: String
    },
    services: [
        {
            name: String,
            price: Number,
            slug: {
                type: String,
                default: ""
            }
        }
    ],
    coupon: String,
    amount: Number,
    totalAmount: Number,
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: true
    },
    disable: {
        type: Boolean,
        default: false
    },
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date },
})

module.exports = mongoose.model("vendororders", vendorOrderSchema);