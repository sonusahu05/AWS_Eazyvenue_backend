const router = require("express").Router();
const { ObjectId } = require('mongodb');
const Enquiry = require('../../../model/Eventplanner');
const EnquiryService = require('./eventplannerService');
const enquiryService = new EnquiryService();

// Create auto enquiry
router.post("/", async (req, res) => {
    try {
        // Check if enquiry already exists for this user+venue combination
        const existingEnquiry = await Enquiry.findOne({
            venueId: req.body.venueId,
            userContact: req.body.userContact
        });

        if (existingEnquiry) {
            return res.json({ message: "Enquiry already exists" });
        }

        const enquiryObj = new Enquiry({
            venueName: req.body.venueName,
            venueId: req.body.venueId,
            userName: req.body.userName,
            userContact: req.body.userContact,
            userEmail: req.body.userEmail
        });

        const savedEnquiry = await enquiryObj.save();
        res.json({ message: "Enquiry created successfully", id: savedEnquiry._id });
        
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Get all enquiries grouped by venue
router.get("/", async (req, res) => {
    try {
        const enquiries = await enquiryService.getGroupedEnquiries();
        res.json({ 
            totalCount: enquiries.length, 
            data: { items: enquiries }
        });
    } catch (error) {
        res.json({ message: error.message });
    }
});

// Update enquiry status
router.put("/:id", async (req, res) => {
    try {
        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json({ message: "Enquiry updated successfully", data: updatedEnquiry });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

module.exports = router;