const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Int32 = require("mongoose-int32").loadType(mongoose);
const venueorderSchema = new mongoose.Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    // slotId: { type: mongoose.Schema.Types.ObjectId },
    // occasionDate: Date,
    orderType: {
        type: String,
        enum: ['enquiry', 'scheduledmeeting', 'order', 'cancelled']
    },
    //slotId: { type: mongoose.Schema.Types.ObjectId },
    duration: [
        {
            occasionStartDate: Date,
            occasionEndDate: Date,
            slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
        }
    ],
    guestcnt: String,
    foodMenuType: [],
    foodType: [],
    decor: String,
    decorName: String,
    vendors: [{
        id: { type: Schema.Types.ObjectId, ref: "Category" },
    }],
    price: Int32,
    bookingPrice: Int32,
    comment: String,
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
});
module.exports = mongoose.model("venueorders", venueorderSchema);