const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const newsLetterSchema = new Schema({
    firstName: String,
    lastName: String,
    fullName:String,
    email: {
        type: String,
        unique: true
    },
    status: Boolean,
    disable:Boolean,
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date, default: Date.now },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date }
});
//add
module.exports = mongoose.model('newsletter', newsLetterSchema);
