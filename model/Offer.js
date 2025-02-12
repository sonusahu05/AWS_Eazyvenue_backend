const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const offerSchema = new Schema({
    name: String,
    title: String,
    description: String,
    offer_type: String,
    code: String,
    is_amount: Boolean,
    discount_percentage: String,
    discount_amount: String,
    mimimum_amount: String,
    offer_valid_from: Date,
    offer_valid_to: Date,
    offer_allocation: {
        onLoadPopUp: { type: Boolean },
        footerBar: { type: Boolean },
        mobileRegistrationPopUp: { type: Boolean },
        venueDetailPage: { type: Boolean }
    },

    assign_offer_to: [{ id: { type: Schema.Types.ObjectId, ref: "Category" } }],
    occasion: [{ id: { type: Schema.Types.ObjectId, ref: "Category" } }],
    city: [{ id: { type: Schema.Types.ObjectId, ref: "City" } }],
    subarea: [{ id: { type: Schema.Types.ObjectId, ref: "Subarea" } }],
    venue: [{
        id: { type: Schema.Types.ObjectId, ref: "Venue" },
    }],

    promo_display_type: String,

    offerImage: [
        {
            offer_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    disable: Boolean,
    status: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date }
});


module.exports = mongoose.model('offers', offerSchema);