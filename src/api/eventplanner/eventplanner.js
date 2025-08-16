const router = require("express").Router();
const { ObjectId } = require('mongodb');
const Enquiry = require('../../../model/Eventplanner');
const EnquiryService = require('./eventplannerService');

const enquiryService = new EnquiryService();

// Create auto enquiry
router.post("/", async (req, res) => {
    console.log('🔥 BACKEND: Received enquiry creation request:', req.body);
    console.log('🔥 BACKEND: Data types - venueId:', typeof req.body.venueId, 'userContact:', typeof req.body.userContact);
    
    try {
        const result = await enquiryService.createEnquiry(req.body);
        console.log('🔥 BACKEND: Enquiry creation result:', result);
        res.status(200).json(result);
        
    } catch (error) {
        console.error('🔥 BACKEND: Error creating enquiry:', error);
        console.error('🔥 BACKEND: Error name:', error.name);
        if (error.name === 'ValidationError') {
            console.error('🔥 BACKEND: Validation errors:', error.errors);
        }
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

// Get all enquiries grouped by venue - FIXED RESPONSE FORMAT
router.get("/", async (req, res) => {
    console.log('🔥 BACKEND: Fetching all enquiries...');
    
    try {
        const enquiries = await enquiryService.getGroupedEnquiries();
        console.log('🔥 BACKEND: Grouped enquiries fetched:', enquiries.length, 'items');
        
        // CORRECT FORMAT - Frontend expects data.items structure
        const response = {
            success: true,
            totalCount: enquiries.length,
            data: {
                items: enquiries  // This is what frontend is looking for
            }
        };
        
        console.log('🔥 BACKEND: Sending response structure:', {
            success: response.success,
            totalCount: response.totalCount,
            itemsCount: response.data.items.length
        });
        
        res.status(200).json(response);
        
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
            return res.status(404).json({ 
                success: false,
                error: "Enquiry not found" 
            });
        }
        
        console.log('🔥 BACKEND: Enquiry updated successfully:', updatedEnquiry._id);
        res.status(200).json({ 
            success: true,
            message: "Enquiry updated successfully", 
            data: updatedEnquiry 
        });
    } catch (error) {
        console.error('🔥 BACKEND: Error updating enquiry:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Get enquiry by ID
router.get("/:id", async (req, res) => {
    console.log('🔥 BACKEND: Fetching enquiry by ID:', req.params.id);
    
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            return res.status(404).json({ 
                success: false,
                error: "Enquiry not found" 
            });
        }
        
        console.log('🔥 BACKEND: Enquiry found:', enquiry._id);
        res.status(200).json({ 
            success: true, 
            data: enquiry 
        });
    } catch (error) {
        console.error('🔥 BACKEND: Error fetching enquiry:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Delete enquiry by ID
router.delete("/:id", async (req, res) => {
    console.log('🗑️ BACKEND: Deleting enquiry with ID:', req.params.id);
    
    try {
        const result = await enquiryService.deleteEnquiry(req.params.id);
        console.log('🗑️ BACKEND: Delete result:', result);
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('🗑️ BACKEND: Error deleting enquiry:', error);
        
        if (error.message === 'Enquiry not found') {
            return res.status(404).json({ 
                success: false,
                error: error.message 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;