const mongoose = require("mongoose");

const modulesSchema = new mongoose.Schema({
    module: String,
    module_description: String,
    level: Number,
    status: Boolean,
    disable: Boolean,
    url: String,
    icon: String,
    permission: {
        edit: Boolean,
        view: Boolean
    },
    submodule : [{
            module: String,
            module_description: String,
            level: Number,
            status: Boolean,
            permission: {
                edit: Boolean,
                view: Boolean
            }
    }],
    created_by: String,
    updated_by: String
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model("modules" , modulesSchema);