// routes/enquiry.js - Fixed Backend Routes
const router = require("express").Router();
const { ObjectId } = require('mongodb');
const Enquiry = require('../../../model/Eventplanner');
const EnquiryService = require('./eventplannerService');

const enquiryService = new EnquiryService();

// Create auto enquiry
router.post("/", async (req, res) => {
    console.log('🔥 BACKEND: Received enquiry creation request:', req.body);
    
    try {
        const result = await enquiryService.createEnquiry(req.body);
        res.json(result);
        
    } catch (error) {
        console.error('🔥 BACKEND: Error creating enquiry:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all enquiries grouped by venue
router.get("/", async (req, res) => {
    console.log('🔥 BACKEND: Fetching all enquiries...');
    
    try {
        const enquiries = await enquiryService.getGroupedEnquiries();
        console.log('🔥 BACKEND: Grouped enquiries fetched:', enquiries.length, 'items');
        
        res.json({ 
            success: true,
            totalCount: enquiries.length, 
            data: { items: enquiries }
        });
    } catch (error) {
        console.error('🔥 BACKEND: Error fetching enquiries:', error);
        res.status(500).json({ 
            success: false,
            message: error.message,
            data: { items: [] }
        });
    }
});

// Update enquiry status
router.put("/:id", async (req, res) => {
    console.log('🔥 BACKEND: Updating enquiry:', req.params.id, 'with data:', req.body);
    
    try {
        const updatedEnquiry = await Enquiry.findByIdAndUpdate(
            req.params.id, 
            { 
                ...req.body,
                updated_at: new Date()
            }, 
            { new: true }
        );
        
        if (!updatedEnquiry) {
            return res.status(404).json({ error: "Enquiry not found" });
        }
        
        console.log('🔥 BACKEND: Enquiry updated successfully:', updatedEnquiry);
        res.json({ 
            success: true,
            message: "Enquiry updated successfully", 
            data: updatedEnquiry 
        });
    } catch (error) {
        console.error('🔥 BACKEND: Error updating enquiry:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get enquiry by ID
router.get("/:id", async (req, res) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ error: "Enquiry not found" });
        }
        res.json({ success: true, data: enquiry });
    } catch (error) {
        console.error('🔥 BACKEND: Error fetching enquiry:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;