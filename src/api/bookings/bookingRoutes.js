const express = require('express');
const router = express.Router();
const bookingController = require('./bookingController');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });

// Create new booking (Admin/Venue Owner)
router.post('/create', auth, bookingController.createBooking);

// Create booking from frontend with tracking data
router.post('/create-from-frontend', bookingController.createBookingFromFrontend);

// Update booking tracking fields (for frontend analytics)
router.put('/update-tracking/:bookingId', bookingController.updateBookingTracking);

// Get venue bookings for calendar view
router.get('/venue/:venueId', auth, bookingController.getVenueBookings);

// Get user bookings (Frontend booking history)
router.get('/user/:userId', bookingController.getUserBookings);

// Block dates for maintenance/other purposes
router.post('/block-dates', auth, bookingController.blockDates);

// Update booking
router.put('/:bookingId', auth, bookingController.updateBooking);

// Delete/Cancel booking
router.delete('/:bookingId', auth, bookingController.deleteBooking);

// Get all venues for admin (venue selection dropdown)
router.get('/admin/venues', auth, bookingController.getVenuesForAdmin);

module.exports = router;
