const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let User = require('../model/User');
const userroleSchema = new mongoose.Schema({
    user_role_name: String,
    user_role_description: String,
    status: Boolean,
    disable: Boolean,
    default_data: Boolean,
    created_by: { type: Schema.Types.ObjectId, ref: "User" },
    created_at: { type: Date, default: Date.now },
    updated_by: { type: Schema.Types.ObjectId, ref: "User" },
    updated_at: { type: Date },
    permissions: [
        {
            module: String,
            module_description: String,
            level: Number,
            status: Boolean,
            url: String,
            icon: String,
            permission: {
                edit: Boolean,
                view: Boolean
            },
            submodule: [{
                module: String,
                module_description: String,
                level: Number,
                status: Boolean,
                url: String,
                icon: String,
                permission: {
                    edit: Boolean,
                    view: Boolean
                }
            }]
        }
    ]
});
module.exports = mongoose.model("userrole", userroleSchema);