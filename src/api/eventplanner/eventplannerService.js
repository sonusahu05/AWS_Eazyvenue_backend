const Enquiry = require('../../../model/Eventplanner');

class EnquiryService {
    
    async createEnquiry(enquiryData) {
        console.log('🔧 SERVICE: Creating enquiry with data:', enquiryData);
        
        try {
            // Validate required fields
            if (!enquiryData.venueId || !enquiryData.userContact) {
                throw new Error('Missing required fields: venueId or userContact');
            }

            // Ensure userContact is a number
            const userContact = typeof enquiryData.userContact === 'string' 
            ? parseInt(enquiryData.userContact, 10) 
            : enquiryData.userContact;

            console.log('🔧 SERVICE: Processed userContact:', userContact, 'type:', typeof userContact);

            // Check if enquiry already exists for this user+venue combination
            const existingEnquiry = await Enquiry.findOne({
                venueId: enquiryData.venueId,
                userContact: userContact
            });
            
            if (existingEnquiry) {
                console.log('🔧 SERVICE: Enquiry already exists:', existingEnquiry._id);
                return { 
                    message: "Enquiry already exists", 
                    existing: true, 
                    success: true,
                    id: existingEnquiry._id 
                };
            }

            // Create new enquiry with proper data types
            const enquiryObj = {
                venueName: enquiryData.venueName,
                venueId: enquiryData.venueId.toString(), // Ensure it's a string
                userName: enquiryData.userName,
                userContact: userContact, // Ensure it's a number
                userEmail: enquiryData.userEmail || '',
                status: 'New',
                created_at: new Date(),
                updated_at: new Date()
            };

            console.log('🔧 SERVICE: Creating enquiry object:', enquiryObj);

            const enquiry = new Enquiry(enquiryObj);

            // Save with error handling
            const savedEnquiry = await enquiry.save();
            console.log('🔧 SERVICE: Enquiry saved successfully with ID:', savedEnquiry._id);
            
            // Verify it was saved
            const verification = await Enquiry.findById(savedEnquiry._id);
            console.log('🔧 SERVICE: Verification - enquiry exists in DB:', !!verification);
            
            if (verification) {
                console.log('🔧 SERVICE: Verified enquiry data:', {
                    id: verification._id,
                    venueName: verification.venueName,
                    userContact: verification.userContact
                });
            }
            
            return { 
                message: "Enquiry created successfully", 
                id: savedEnquiry._id,
                success: true
            };
            
        } catch (error) {
            console.error('🔧 SERVICE: Error creating enquiry:', error);
            
            // Log validation errors specifically
            if (error.name === 'ValidationError') {
                console.error('🔧 SERVICE: Validation errors:', error.errors);
            }
            
            throw error;
        }
    }

    async getGroupedEnquiries() {
        console.log('🔧 SERVICE: Starting to group enquiries...');
        
        try {
            // First, let's get all enquiries to see what we have
            const allEnquiries = await Enquiry.find({}).sort({ created_at: -1 });
            console.log('🔧 SERVICE: Total enquiries found in database:', allEnquiries.length);
            
            if (allEnquiries.length === 0) {
                console.log('🔧 SERVICE: No enquiries found in database');
                return [];
            }

            // Log first few enquiries to see structure
            if (allEnquiries.length > 0) {
                console.log('🔧 SERVICE: Sample enquiry:', {
                    id: allEnquiries[0]._id,
                    venueName: allEnquiries[0].venueName,
                    venueId: allEnquiries[0].venueId,
                    userName: allEnquiries[0].userName,
                    userContact: allEnquiries[0].userContact
                });
            }

            const enquiries = await Enquiry.aggregate([
                {
                    $sort: { created_at: -1 }
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
                    $sort: { created_at: -1 }
                }
            ]);
            
            console.log('🔧 SERVICE: Aggregated enquiries count:', enquiries.length);
            
            const result = enquiries.map(venue => ({
                id: venue.latestEnquiryId,
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
            
            console.log('🔧 SERVICE: Final result count:', result.length);
            if (result.length > 0) {
                console.log('🔧 SERVICE: Sample result item:', {
                    id: result[0].id,
                    venueName: result[0].venueName,
                    leadCount: result[0].leadCount
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('🔧 SERVICE: Error in getGroupedEnquiries:', error);
            throw error;
        }
    }

    async deleteEnquiry(enquiryId) {
        console.log('🗑️ SERVICE: Deleting enquiry with ID:', enquiryId);
        
        try {
            // Validate the enquiry ID
            if (!enquiryId) {
                throw new Error('Enquiry ID is required for deletion');
            }

            // Find and delete the enquiry
            const deletedEnquiry = await Enquiry.findByIdAndDelete(enquiryId);
            
            if (!deletedEnquiry) {
                throw new Error('Enquiry not found');
            }

            console.log('🗑️ SERVICE: Successfully deleted enquiry:', deletedEnquiry._id);
            
            return {
                success: true,
                message: 'Enquiry deleted successfully',
                deletedId: deletedEnquiry._id,
                deletedData: {
                    venueName: deletedEnquiry.venueName,
                    userName: deletedEnquiry.userName,
                    userContact: deletedEnquiry.userContact
                }
            };
            
        } catch (error) {
            console.error('🗑️ SERVICE: Error in deleteEnquiry:', error);
            throw error;
        }
    }
}

module.exports = EnquiryService;