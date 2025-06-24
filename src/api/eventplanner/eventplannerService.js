// eventplannerService.js - Fixed Backend Service
const Enquiry = require('../../../model/Eventplanner');

class EnquiryService {
    
    async getGroupedEnquiries() {
        console.log('🔧 SERVICE: Starting to group enquiries...');
        
        try {
            const enquiries = await Enquiry.aggregate([
                {
                    $sort: { created_at: -1 } // Sort by newest first
                },
                {
                    $group: {
                        _id: "$venueId",
                        venueName: { $first: "$venueName" },
                        userName: { $first: "$userName" },
                        userContact: { $first: "$userContact" },
                        userEmail: { $first: "$userEmail" },
                        leadCount: { $sum: 1 },
                        created_at: { $first: "$created_at" },
                        status: { $first: "$status" },
                        latestEnquiryId: { $first: "$_id" },
                        enquiries: { $push: "$$ROOT" }
                    }
                },
                {
                    $sort: { created_at: -1 } // Sort groups by latest enquiry
                }
            ]);

            console.log('🔧 SERVICE: Raw aggregated enquiries:', enquiries);

            const result = enquiries.map(venue => ({
                id: venue.latestEnquiryId, // Use the latest enquiry ID for updates
                venueName: venue.venueName,
                userName: venue.userName,
                userContact: venue.userContact,
                userEmail: venue.userEmail,
                leadCount: venue.leadCount,
                created_at: venue.created_at,
                status: venue.status || 'New',
                venueId: venue._id,
                allEnquiries: venue.enquiries
            }));

            console.log('🔧 SERVICE: Processed enquiries result:', result);
            return result;
            
        } catch (error) {
            console.error('🔧 SERVICE: Error in getGroupedEnquiries:', error);
            throw error;
        }
    }

    async createEnquiry(enquiryData) {
        console.log('🔧 SERVICE: Creating enquiry with data:', enquiryData);
        
        try {
            // Check if enquiry already exists for this user+venue combination
            const existingEnquiry = await Enquiry.findOne({
                venueId: enquiryData.venueId,
                userContact: enquiryData.userContact
            });

            if (existingEnquiry) {
                console.log('🔧 SERVICE: Enquiry already exists:', existingEnquiry);
                return { message: "Enquiry already exists", existing: true, id: existingEnquiry._id };
            }

            const enquiry = new Enquiry({
                venueName: enquiryData.venueName,
                venueId: enquiryData.venueId,
                userName: enquiryData.userName,
                userContact: enquiryData.userContact,
                userEmail: enquiryData.userEmail,
                status: 'New',
                created_at: new Date()
            });

            const savedEnquiry = await enquiry.save();
            console.log('🔧 SERVICE: Enquiry created successfully:', savedEnquiry);
            
            return { message: "Enquiry created successfully", id: savedEnquiry._id };
            
        } catch (error) {
            console.error('🔧 SERVICE: Error creating enquiry:', error);
            throw error;
        }
    }
}

module.exports = EnquiryService;