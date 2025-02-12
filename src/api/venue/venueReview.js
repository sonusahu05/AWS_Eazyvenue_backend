const express = require('express');
const router = express.Router();
const Venue = require("../../../model/Venue");
router.post('/:id/reviews', async (req, res) => {
    try {
        const venueId = req.params.id;
        const review = {
            reviewtitle: req.body.reviewtitle,
            reviewdescription: req.body.reviewdescription,
            reviewrating: req.body.reviewrating,
            created_at: new Date()
        };

        const venue = await Venue.findById(venueId);
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' });
        }

        venue.reviews.unshift(review);
        await venue.save();

        res.status(201).json(review);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
});

module.exports = router;
