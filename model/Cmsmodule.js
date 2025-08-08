const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const cmsmoduleSchema = new mongoose.Schema({
    cmsTitle: String,    
    cmspageTitle: String,
    slug: String,
    cmsContent: String,
    cmsDescription: String,
    cmsImage: String,
    metaKeyword: String,
    metaDescription: String,
    status: Boolean,
    disable: Boolean,
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date, default: Date.now },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date }    
});

module.exports = mongoose.model("Cmsmodule" , cmsmoduleSchema);