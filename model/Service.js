const mongoose = require("mongoose");
const serviceSchema = new mongoose.Schema({
    service_title: String,
    service_meta_title: String,
    service_meta_keyword: String,
    service_short_description: String,
    service_long_description: String,
    service_image: String,
    status: String
});
module.exports = mongoose.model("service" , serviceSchema);