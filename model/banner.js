const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let User = require('../model/User');

const bannerSchema = new mongoose.Schema({
    banner_title: String,
    banner_image: [
        {
            banner_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    slug: String,
    banner_url: String,
    banner_content: String,
    status: Boolean,
    disable: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("banner", bannerSchema);