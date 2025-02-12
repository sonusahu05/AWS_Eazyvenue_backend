const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productreviewSchema = new mongoose.Schema({
    sku: String,
    reviewHeading: String,
    customerName: String,
    reviewDescription: String,
    reviewImage: [],
    rating: String,
    email: String,
    date: String,
    status: Boolean,
    approve: Boolean,
    disable: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});
module.exports = mongoose.model("Productreview", productreviewSchema);
