const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: String,
  location: String,
  description: String,
  capacity: Number,
  venueImage: [
  {
    venue_image_src: String,
    alt: String
  }
],
  mobileNumber: Number
}, { timestamps: true });

module.exports = mongoose.model('Venue', venueSchema);
