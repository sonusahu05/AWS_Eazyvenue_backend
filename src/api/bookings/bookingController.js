const Booking = require('../../../model/Booking');
const Venue = require('../../../model/Venue');

class BookingController {
    
    constructor() {
        // Bind methods to maintain 'this' context
        this.createBooking = this.createBooking.bind(this);
        this.getVenueBookings = this.getVenueBookings.bind(this);
        this.blockDates = this.blockDates.bind(this);
        this.updateBooking = this.updateBooking.bind(this);
        this.deleteBooking = this.deleteBooking.bind(this);
        this.getVenuesForAdmin = this.getVenuesForAdmin.bind(this);
        this.checkBookingConflict = this.checkBookingConflict.bind(this);
        this.convertToCalendarDate = this.convertToCalendarDate.bind(this);
        this.getEventColor = this.getEventColor.bind(this);
    }
    
    /**
     * Create a new booking (Admin/Venue Owner)
     */
    async createBooking(req, res) {
        try {
            const {
                venueId,
                venueName,
                userId,
                userName,
                userContact,
                userEmail,
                details
            } = req.body;

            // Validate required fields
            if (!venueId || !userId || !userName || !userContact || !userEmail || !details) {
                return res.status(400).json({
                    success: false,
                    message: 'All required fields must be provided'
                });
            }

            // Validate date range
            if (!details.startFilterDate || !details.endFilterDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            // Check for conflicting bookings
            const conflictingBooking = await this.checkBookingConflict(
                venueId, 
                details.startFilterDate, 
                details.endFilterDate
            );

            if (conflictingBooking) {
                const conflictType = conflictingBooking.details.bookingType === 'blocked' ? 'blocked' : 'booked';
                const conflictReason = conflictingBooking.details.bookingType === 'blocked' 
                    ? `Dates are blocked for: ${conflictingBooking.details.occasion || 'maintenance'}`
                    : `Venue is already booked by ${conflictingBooking.userName} for ${conflictingBooking.details.occasion}`;
                
                return res.status(409).json({
                    success: false,
                    message: `Cannot create booking - venue dates conflict`,
                    error: conflictReason,
                    conflictDetails: {
                        type: conflictType,
                        startDate: conflictingBooking.details.startFilterDate,
                        endDate: conflictingBooking.details.endFilterDate,
                        customerName: conflictingBooking.userName,
                        occasion: conflictingBooking.details.occasion,
                        bookingType: conflictingBooking.details.bookingType
                    }
                });
            }

            // Get venue name if not provided
            let finalVenueName = venueName;
            if (!finalVenueName) {
                const venue = await Venue.findById(venueId);
                finalVenueName = venue ? venue.name : 'Unknown Venue';
            }

            // Calculate total amount
            const totalAmount = (details.weddingDecorPrice || 0) + (details.foodMenuPrice || 0);

            const bookingData = {
                venueId,
                venueName: finalVenueName,
                userId,
                userName,
                userContact,
                userEmail,
                details: {
                    ...details,
                    totalAmount
                },
                createdBy: req.user?.id || userId
            };

            const booking = new Booking(bookingData);
            await booking.save();

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: booking
            });

        } catch (error) {
            console.error('Error creating booking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: error.message
            });
        }
    }

    /**
     * Get bookings for a venue (Calendar view)
     */
    async getVenueBookings(req, res) {
        try {
            const { venueId } = req.params;
            const { startDate, endDate, status } = req.query;

            let query = { venueId };

            // Date range filter
            if (startDate || endDate) {
                query.$or = [];
                
                if (startDate && endDate) {
                    query.$or.push({
                        $and: [
                            { 'details.startFilterDate': { $lte: endDate } },
                            { 'details.endFilterDate': { $gte: startDate } }
                        ]
                    });
                }
            }

            // Status filter
            if (status) {
                query['details.bookingStatus'] = status;
            }

            const bookings = await Booking.find(query)
                .sort({ 'details.startFilterDate': 1 })
                .lean();

            // Transform data for calendar view
            const calendarEvents = bookings.map(booking => ({
                id: booking._id,
                title: `${booking.details.occasion} - ${booking.userName}`,
                start: this.convertToCalendarDate(booking.details.startFilterDate),
                end: this.convertToCalendarDate(booking.details.endFilterDate),
                backgroundColor: this.getEventColor(booking.details.bookingType, booking.details.bookingStatus),
                borderColor: this.getEventColor(booking.details.bookingType, booking.details.bookingStatus),
                extendedProps: {
                    bookingId: booking._id,
                    venueId: booking.venueId,
                    venueName: booking.venueName,
                    userName: booking.userName,
                    userContact: booking.userContact,
                    userEmail: booking.userEmail,
                    occasion: booking.details.occasion,
                    guestCount: booking.details.guestCount,
                    bookingType: booking.details.bookingType,
                    bookingStatus: booking.details.bookingStatus,
                    isBookedByAdmin: booking.details.isBookedByAdmin,
                    totalAmount: booking.details.totalAmount,
                    paymentStatus: booking.details.paymentStatus,
                    eventDuration: booking.details.eventDuration,
                    weddingDecorType: booking.details.weddingDecorType,
                    foodMenuType: booking.details.foodMenuType
                }
            }));

            res.status(200).json({
                success: true,
                data: {
                    bookings: bookings,
                    calendarEvents: calendarEvents,
                    summary: {
                        totalBookings: bookings.length,
                        confirmedBookings: bookings.filter(b => b.details.bookingStatus === 'confirmed').length,
                        pendingBookings: bookings.filter(b => b.details.bookingStatus === 'pending').length,
                        blockedDates: bookings.filter(b => b.details.bookingType === 'blocked').length
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching venue bookings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }
    }

    /**
     * Block dates for maintenance or other purposes
     */
    async blockDates(req, res) {
        try {
            const {
                venueId,
                startDate,
                endDate,
                reason,
                notes
            } = req.body;

            // Debug user data
            console.log('User data in blockDates:', req.user);

            const userId = req.user?.id || req.user?._id || 'system';
            const userName = req.user?.name || req.user?.username || 'System Admin';
            const userEmail = req.user?.email || 'admin@system.com';
            const userContact = req.user?.contact || req.user?.phone || req.user?.mobile || '0000000000';

            // Validate required fields
            if (!venueId || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Venue ID, start date, and end date are required'
                });
            }

            console.log('Block dates data:', {
                venueId,
                startDate,
                endDate,
                userId,
                userName,
                userEmail,
                userContact
            });

            // Check for conflicts
            const conflictingBooking = await this.checkBookingConflict(venueId, startDate, endDate);
            if (conflictingBooking) {
                const conflictType = conflictingBooking.details.bookingType === 'blocked' ? 'blocked' : 'booked';
                const conflictReason = conflictingBooking.details.bookingType === 'blocked' 
                    ? `Dates are already blocked for: ${conflictingBooking.details.occasion || 'maintenance'}`
                    : `Venue is already booked by ${conflictingBooking.userName} for ${conflictingBooking.details.occasion}`;
                
                return res.status(409).json({
                    success: false,
                    message: 'Cannot block dates - venue dates conflict',
                    error: conflictReason,
                    conflictDetails: {
                        type: conflictType,
                        startDate: conflictingBooking.details.startFilterDate,
                        endDate: conflictingBooking.details.endFilterDate,
                        customerName: conflictingBooking.userName,
                        occasion: conflictingBooking.details.occasion,
                        bookingType: conflictingBooking.details.bookingType
                    }
                });
            }

            // Get venue name
            const venue = await Venue.findById(venueId);
            const venueName = venue ? venue.name : 'Unknown Venue';

            const blockingData = {
                venueId,
                venueName,
                userId,
                userName,
                userContact,
                userEmail,
                details: {
                    isBookedByAdmin: true,
                    startFilterDate: startDate,
                    endFilterDate: endDate,
                    occasion: reason || 'Venue Blocked',
                    guestCount: '0',
                    bookingType: 'blocked',
                    bookingStatus: 'confirmed',
                    bookingNotes: notes || '',
                    paymentStatus: 'not_applicable'
                },
                createdBy: userId
            };

            console.log('Final blocking data before save:', JSON.stringify(blockingData, null, 2));

            const booking = new Booking(blockingData);
            await booking.save();

            res.status(201).json({
                success: true,
                message: 'Dates blocked successfully',
                data: booking
            });

        } catch (error) {
            console.error('Error blocking dates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to block dates',
                error: error.message
            });
        }
    }

    /**
     * Update booking
     */
    async updateBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Check if dates are being changed and validate conflicts
            if (updateData.details?.startFilterDate || updateData.details?.endFilterDate) {
                const startDate = updateData.details.startFilterDate || booking.details.startFilterDate;
                const endDate = updateData.details.endFilterDate || booking.details.endFilterDate;
                
                const conflictingBooking = await this.checkBookingConflict(
                    booking.venueId, 
                    startDate, 
                    endDate, 
                    bookingId
                );

                if (conflictingBooking) {
                    return res.status(409).json({
                        success: false,
                        message: 'Cannot update - dates conflict with existing booking',
                        conflictingBooking
                    });
                }
            }

            // Update booking
            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                {
                    ...updateData,
                    updatedBy: userId,
                    updatedAt: new Date()
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: 'Booking updated successfully',
                data: updatedBooking
            });

        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update booking',
                error: error.message
            });
        }
    }

    /**
     * Delete/Cancel booking
     */
    async deleteBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user?.id;

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            await Booking.findByIdAndDelete(bookingId);

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully'
            });

        } catch (error) {
            console.error('Error deleting booking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to cancel booking',
                error: error.message
            });
        }
    }

    /**
     * Get all venues for admin (for venue selection dropdown)
     */
    async getVenuesForAdmin(req, res) {
        try {
            console.log('🔍 Fetching venues for admin dropdown...');
            
            // First, let's check the total count
            const totalCount = await Venue.countDocuments({});
            console.log(`📊 Total venues in database: ${totalCount}`);
            
            // Get all venues without any filter first
            const allVenues = await Venue.find({})
                .select('_id name city state status createdAt')
                .sort({ name: 1 })
                .lean();
            
            // console.log(`📋 Found ${allVenues.length} venues:`);
            // allVenues.forEach((venue, index) => {
            //     console.log(`  ${index + 1}. ${venue.name} (${venue.city}, ${venue.state}) - Status: ${venue.status || 'undefined'}`);
            // });
            
            // For booking management, return ALL venues (admins need to manage all venues)
            // Remove status filtering - booking management should show all venues
            const venues = allVenues;
            
            // console.log(`✅ Returning ${venues.length} venues for dropdown (all venues for booking management)`);

            res.status(200).json({
                success: true,
                data: venues,
                debug: {
                    totalInDB: totalCount,
                    foundVenues: allVenues.length,
                    returnedVenues: venues.length
                }
            });

        } catch (error) {
            console.error('❌ Error fetching venues:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch venues',
                error: error.message
            });
        }
    }

    // Helper methods
    async checkBookingConflict(venueId, startDate, endDate, excludeBookingId = null) {
        // Convert DD/MM/YYYY to Date objects for proper comparison
        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(year, month - 1, day); // month is 0-indexed
        };
        
        const requestStart = parseDate(startDate);
        const requestEnd = parseDate(endDate);
        
        console.log('🔍 Checking booking conflict for:', {
            venueId,
            requestedRange: `${startDate} to ${endDate}`,
            requestStart: requestStart.toISOString(),
            requestEnd: requestEnd.toISOString()
        });
        
        // First get all active bookings for this venue
        let query = {
            venueId,
            'details.bookingStatus': { $ne: 'cancelled' }
        };

        if (excludeBookingId) {
            query._id = { $ne: excludeBookingId };
        }

        const existingBookings = await Booking.find(query);
        
        // Check each booking for actual overlap
        for (const booking of existingBookings) {
            const existingStart = parseDate(booking.details.startFilterDate);
            const existingEnd = parseDate(booking.details.endFilterDate);
            
            console.log('📅 Comparing with existing booking:', {
                bookingId: booking._id,
                existingRange: `${booking.details.startFilterDate} to ${booking.details.endFilterDate}`,
                existingStart: existingStart.toISOString(),
                existingEnd: existingEnd.toISOString(),
                customer: booking.userName,
                occasion: booking.details.occasion
            });
            
            // Check for ACTUAL overlap (not adjacent dates)
            // Overlap occurs when: requestStart < existingEnd AND requestEnd > existingStart
            // This properly excludes adjacent bookings
            if (requestStart < existingEnd && requestEnd > existingStart) {
                console.log('❌ CONFLICT DETECTED:', {
                    conflictReason: 'Date ranges overlap',
                    requestedDates: `${startDate} to ${endDate}`,
                    conflictingDates: `${booking.details.startFilterDate} to ${booking.details.endFilterDate}`,
                    conflictingBooking: booking.userName,
                    occasion: booking.details.occasion
                });
                
                return booking;
            }
        }
        
        console.log('✅ No conflicts found - dates are available');
        return null;
    }

    convertToCalendarDate(dateString) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    getEventColor(bookingType, bookingStatus) {
        if (bookingType === 'blocked' || bookingType === 'maintenance') {
            return '#dc3545'; // Red for blocked/maintenance
        }
        
        switch (bookingStatus) {
            case 'confirmed':
                return '#28a745'; // Green for confirmed
            case 'pending':
                return '#ffc107'; // Yellow for pending
            case 'cancelled':
                return '#6c757d'; // Gray for cancelled
            default:
                return '#007bff'; // Blue for default
        }
    }
}

module.exports = new BookingController();
