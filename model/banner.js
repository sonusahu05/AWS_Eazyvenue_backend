const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let User = require('../model/User');

const bannerSchema = new mongoose.Schema({
    // Basic fields
    banner_title: { type: String, required: true },
    banner_image: [
        {
            banner_image_src: String,
            alt: String,
            default: Boolean
        }
    ],
    slug: { type: String, required: true, unique: true },
    banner_content: { type: String, required: true },
    status: { type: Boolean, default: true },
    disable: { type: Boolean, default: false },
    
    // Blog specific fields
    post_type: { 
        type: String, 
        enum: ['regular', 'featured', 'instagram'], 
        default: 'regular' 
    },
    category: { type: String, required: true },
    author: { type: String, required: true },
    reading_time: String,
    meta_description: String,
    seo_title: String,
    seo_keywords: String,
    tags: [String],
    
    // Featured post fields
    featured_order: { type: Number, default: 0 },
    
    // Instagram fields
    instagram_url: String,
    instagram_caption: String,
    is_video: { type: Boolean, default: false },
    
    // Publishing fields
    publish_date: { type: Date, default: Date.now },
    is_published: { type: Boolean, default: false },
    
    // System fields
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date, default: Date.now },
    deleted_by: { type: Schema.Types.ObjectId, ref: "User" },
    deleted_at: Date
});

module.exports = mongoose.model("banner", bannerSchema);