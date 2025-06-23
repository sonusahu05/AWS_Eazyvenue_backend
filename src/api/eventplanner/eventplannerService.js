const Enquiry = require('../../../model/Eventplanner');

class EnquiryService {
    
    async getGroupedEnquiries() {
        try {
            const enquiries = await Enquiry.aggregate([
                {
                    $group: {
                        _id: "$venueId",
                        venueName: { $first: "$venueName" },
                        leadCount: { $sum: 1 },
                        latestEnquiry: { $first: "$$ROOT" },
                        enquiries: { $push: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        leadCount: { $gt: 0 } // Only show venues with leads
                    }
                },
                {
                    $sort: { leadCount: -1 }
                }
            ]);

            return enquiries.map(venue => ({
                id: venue._id,
                venueName: venue.venueName,
                userName: venue.latestEnquiry.userName,
                userContact: venue.latestEnquiry.userContact,
                leadCount: venue.leadCount,
                created_at: venue.latestEnquiry.created_at,
                status: venue.latestEnquiry.status,
                allEnquiries: venue.enquiries
            }));
            
        } catch (error) {
            throw error;
        }
    }
}

module.exports = EnquiryService;