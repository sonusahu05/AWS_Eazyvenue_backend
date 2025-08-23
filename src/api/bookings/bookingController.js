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
        this.createBookingFromFrontend = this.createBookingFromFrontend.bind(this);
        this.updateBookingTracking = this.updateBookingTracking.bind(this);
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

            // Ensure eventDuration is properly mapped from slot data
            let eventDuration = details.eventDuration;
            if (!eventDuration && details.slotData) {
                // Map slot names to duration values
                if (details.slotData.toLowerCase().includes('morning')) {
                    eventDuration = 'morning';
                } else if (details.slotData.toLowerCase().includes('evening')) {
                    eventDuration = 'evening';
                } else if (details.slotData.toLowerCase().includes('night')) {
                    eventDuration = 'night';
                } else if (details.slotData.toLowerCase().includes('full')) {
                    eventDuration = 'full';
                }
            }

            // Ensure foodMenuPlate is properly formatted
            let foodMenuPlate = details.foodMenuPlate;
            if (foodMenuPlate && !['1x1', '2x2', '3x3'].includes(foodMenuPlate)) {
                // Try to parse and format the plate value
                if (typeof foodMenuPlate === 'string') {
                    const plateMatch = foodMenuPlate.match(/(\d+)x(\d+)/);
                    if (plateMatch) {
                        foodMenuPlate = plateMatch[0]; // e.g., "2x2"
                    } else {
                        foodMenuPlate = null; // Invalid format
                    }
                } else {
                    foodMenuPlate = null;
                }
            }

            const bookingData = {
                venueId,
                venueName: finalVenueName,
                userId,
                userName,
                userContact,
                userEmail,
                details: {
                    ...details,
                    eventDuration,
                    foodMenuPlate,
                    totalAmount,
                    // Analytics tracking fields with defaults
                    sendEnquiryClicked: details.sendEnquiryClicked || false,
                    clickedOnReserved: details.clickedOnReserved || false,
                    clickedOnBookNow: details.clickedOnBookNow || false,
                    madePayment: details.madePayment || false
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

    /**
     * Create booking from frontend with proper tracking data
     */
    async createBookingFromFrontend(req, res) {
        try {
            console.log('📊 Frontend booking request received:', JSON.stringify(req.body, null, 2));
            
            const {
                venueId,
                venueName,
                userId,
                userName,
                userContact,
                userEmail,
                occasionDate,
                durationData,
                guestCount,
                categoryId,
                selectedSlot,
                selectedFoodType,
                selectedFoodMenuTypes,
                selectedDecor,
                decorPrice,
                foodPrice,
                totalAmount,
                paymentAmount,
                paymentType,
                orderType,
                // These are the correctly populated fields from frontend
                eventDuration,
                foodMenuType,
                foodMenuPlate,
                // Analytics tracking fields
                sendEnquiryClicked = false,
                clickedOnReserved = false,
                clickedOnBookNow = false,
                madePayment = false
            } = req.body;

            console.log('📊 BACKEND: Received eventDuration from frontend:', eventDuration);
            console.log('📊 BACKEND: Received foodMenuType from frontend:', foodMenuType);
            console.log('📊 BACKEND: Received foodMenuPlate from frontend:', foodMenuPlate);

            // Validate required fields
            if (!venueId || !userId || !userName || !userContact || !userEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: venueId, userId, userName, userContact, userEmail'
                });
            }

            if (!durationData || !durationData.length || !durationData[0].occasionStartDate || !durationData[0].occasionEndDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required date information'
                });
            }

            // Convert dates to DD/MM/YYYY format
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            };

            const startDate = formatDate(durationData[0].occasionStartDate);
            const endDate = formatDate(durationData[0].occasionEndDate);

            // Check for conflicting bookings
            const conflictingBooking = await this.checkBookingConflict(venueId, startDate, endDate);
            if (conflictingBooking) {
                return res.status(409).json({
                    success: false,
                    message: 'Venue dates are not available',
                    conflictDetails: {
                        startDate: conflictingBooking.details.startFilterDate,
                        endDate: conflictingBooking.details.endFilterDate,
                        customerName: conflictingBooking.userName,
                        occasion: conflictingBooking.details.occasion
                    }
                });
            }

            // Get venue and occasion details
            const venue = await Venue.findById(venueId);
            const finalVenueName = venueName || (venue ? venue.name : 'Unknown Venue');

            // Use the eventDuration directly from frontend (it's already correctly calculated)
            // But handle backward compatibility for 'full-day' -> 'full'
            let finalEventDuration = eventDuration || 'full';
            if (finalEventDuration === 'full-day') {
                finalEventDuration = 'full';
            }
            console.log('📊 Using eventDuration from frontend:', finalEventDuration);

            // Use the foodMenuPlate directly from frontend (it's already correctly calculated)  
            const finalFoodMenuPlate = foodMenuPlate || '2x2';
            console.log('📊 Using foodMenuPlate from frontend:', finalFoodMenuPlate);

            // Use the foodMenuType directly from frontend (it's already correctly formatted)
            const finalFoodMenuType = foodMenuType || 'standard';
            console.log('📊 Using foodMenuType from frontend:', finalFoodMenuType);

            // Get occasion name (you might need to fetch this from a Category model)
            let occasionName = 'Event';
            try {
                // Assuming you have a Category/Occasion model
                if (categoryId) {
                    const Category = require('../../../model/Category'); // Adjust path as needed
                    const category = await Category.findById(categoryId);
                    if (category) {
                        occasionName = category.name;
                    }
                }
            } catch (err) {
                console.log('Could not fetch occasion name:', err.message);
            }

            // Determine booking status based on order type and payment
            let bookingStatus = 'pending';
            let paymentStatus = 'pending';
            
            if (orderType === 'send_enquires') {
                bookingStatus = 'pending';
                paymentStatus = 'not_applicable';
            } else if (orderType === 'book_now') {
                bookingStatus = madePayment ? 'confirmed' : 'pending';
                paymentStatus = madePayment ? 'paid' : 'pending';
            }

            const bookingData = {
                venueId,
                venueName: finalVenueName,
                userId,
                userName,
                userContact,
                userEmail,
                details: {
                    isBookedByAdmin: false,
                    startFilterDate: startDate,
                    endFilterDate: endDate,
                    eventDuration: finalEventDuration, // Use the corrected value from frontend
                    occasion: occasionName,
                    weddingDecorType: selectedDecor?.name || null,
                    weddingDecorPrice: decorPrice || 0,
                    foodMenuType: finalFoodMenuType, // Use the corrected value from frontend
                    foodMenuPrice: foodPrice || 0,
                    foodMenuPlate: finalFoodMenuPlate, // Use the corrected value from frontend
                    guestCount: String(guestCount),
                    bookingType: 'online',
                    bookingNotes: `Order type: ${orderType}, Payment type: ${paymentType}`,
                    totalAmount: totalAmount || 0,
                    paymentStatus,
                    bookingStatus,
                    // Analytics tracking fields
                    sendEnquiryClicked: orderType === 'send_enquires' ? true : sendEnquiryClicked,
                    clickedOnReserved: clickedOnReserved,
                    clickedOnBookNow: orderType === 'book_now' ? true : clickedOnBookNow,
                    madePayment: madePayment
                },
                createdBy: userId
            };

            console.log('📊 Creating booking with tracking data:', JSON.stringify(bookingData, null, 2));
            console.log('📊 BACKEND VERIFICATION: Final values being saved to database:');
            console.log('   📊 eventDuration:', bookingData.details.eventDuration);
            console.log('   📊 foodMenuType:', bookingData.details.foodMenuType);
            console.log('   📊 foodMenuPlate:', bookingData.details.foodMenuPlate);

            const booking = new Booking(bookingData);
            await booking.save();
            
            console.log('📊 BOOKING SAVED SUCCESSFULLY with ID:', booking._id);
            console.log('📊 SAVED BOOKING DETAILS:');
            console.log('   📊 eventDuration:', booking.details.eventDuration);
            console.log('   📊 foodMenuType:', booking.details.foodMenuType);
            console.log('   📊 foodMenuPlate:', booking.details.foodMenuPlate);

            console.log('✅ Booking created successfully with ID:', booking._id);

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: {
                    bookingId: booking._id,
                    venueId: booking.venueId,
                    venueName: booking.venueName,
                    startDate: booking.details.startFilterDate,
                    endDate: booking.details.endFilterDate,
                    occasion: booking.details.occasion,
                    guestCount: booking.details.guestCount,
                    totalAmount: booking.details.totalAmount,
                    bookingStatus: booking.details.bookingStatus,
                    paymentStatus: booking.details.paymentStatus,
                    tracking: {
                        sendEnquiryClicked: booking.details.sendEnquiryClicked,
                        clickedOnReserved: booking.details.clickedOnReserved,
                        clickedOnBookNow: booking.details.clickedOnBookNow,
                        madePayment: booking.details.madePayment
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error creating frontend booking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: error.message
            });
        }
    }

    /**
     * Update booking tracking fields (for frontend analytics)
     */
    async updateBookingTracking(req, res) {
        try {
            const { bookingId } = req.params;
            const {
                sendEnquiryClicked,
                clickedOnReserved,
                clickedOnBookNow,
                madePayment,
                paymentStatus,
                bookingStatus
            } = req.body;

            console.log('📊 Updating booking tracking:', {
                bookingId,
                trackingData: req.body
            });

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found'
                });
            }

            // Prepare update data
            const updateData = {
                updatedAt: new Date()
            };

            // Update tracking fields if provided
            if (sendEnquiryClicked !== undefined) {
                updateData['details.sendEnquiryClicked'] = sendEnquiryClicked;
            }
            if (clickedOnReserved !== undefined) {
                updateData['details.clickedOnReserved'] = clickedOnReserved;
            }
            if (clickedOnBookNow !== undefined) {
                updateData['details.clickedOnBookNow'] = clickedOnBookNow;
            }
            if (madePayment !== undefined) {
                updateData['details.madePayment'] = madePayment;
            }
            if (paymentStatus !== undefined) {
                updateData['details.paymentStatus'] = paymentStatus;
            }
            if (bookingStatus !== undefined) {
                updateData['details.bookingStatus'] = bookingStatus;
            }

            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                updateData,
                { new: true }
            );

            console.log('✅ Booking tracking updated:', updatedBooking._id);

            res.status(200).json({
                success: true,
                message: 'Booking tracking updated successfully',
                data: {
                    bookingId: updatedBooking._id,
                    tracking: {
                        sendEnquiryClicked: updatedBooking.details.sendEnquiryClicked,
                        clickedOnReserved: updatedBooking.details.clickedOnReserved,
                        clickedOnBookNow: updatedBooking.details.clickedOnBookNow,
                        madePayment: updatedBooking.details.madePayment
                    },
                    paymentStatus: updatedBooking.details.paymentStatus,
                    bookingStatus: updatedBooking.details.bookingStatus
                }
            });

        } catch (error) {
            console.error('❌ Error updating booking tracking:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update booking tracking',
                error: error.message
            });
        }
    }

    // Helper methods
    async checkBookingConflict(venueId, startDate, endDate, excludeBookingId = null) {
        // Enhanced date parsing to handle multiple formats
        const parseDate = (dateStr) => {
            if (!dateStr) {
                throw new Error('Date string is required');
            }
            
            console.log('🗓️ Parsing date string:', dateStr);
            
            let parsedDate;
            
            // Handle DD/MM/YYYY format
            if (dateStr.includes('/') && dateStr.split('/').length === 3) {
                const [day, month, year] = dateStr.split('/');
                parsedDate = new Date(year, month - 1, day); // month is 0-indexed
                console.log('📅 Parsed DD/MM/YYYY format:', { day, month, year, result: parsedDate });
            }
            // Handle YYYY-MM-DD format
            else if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                const [year, month, day] = dateStr.split('T')[0].split('-'); // Remove time if present
                parsedDate = new Date(year, month - 1, day);
                console.log('📅 Parsed YYYY-MM-DD format:', { year, month, day, result: parsedDate });
            }
            // Handle ISO string or other formats
            else {
                parsedDate = new Date(dateStr);
                console.log('📅 Parsed as ISO/general format:', parsedDate);
            }
            
            // Validate the parsed date
            if (isNaN(parsedDate.getTime())) {
                throw new Error(`Invalid date format: ${dateStr}. Expected DD/MM/YYYY or YYYY-MM-DD`);
            }
            
            return parsedDate;
        };
        
        try {
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
            
        } catch (error) {
            console.error('❌ Error in checkBookingConflict:', error);
            throw new Error(`Date parsing error: ${error.message}`);
        }
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


    /**
 * Get global hot dates across all venues
 */
async getGlobalHotDates(req, res) {
  try {
    // Fetch all bookings (confirmed + pending only, not cancelled)
    const bookings = await Booking.find({ "details.bookingStatus": { $in: ["confirmed", "pending"] } }).lean();

    // Aggregate counts per date
    const hotDateMap = {};

    bookings.forEach(b => {
      const start = b.details.startFilterDate;
      const end = b.details.endFilterDate;
      const occasion = b.details.occasion || "Event";

      // Handle single-day or range
      const startDate = new Date(start.split("/").reverse().join("-"));
      const endDate = new Date(end.split("/").reverse().join("-"));

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split("T")[0];
        if (!hotDateMap[key]) {
          hotDateMap[key] = {
            date: key,
            count: 0,
            totalViews: 0,
            enquiries: 0,
            occasions: {}
          };
        }
        hotDateMap[key].count++;
        hotDateMap[key].occasions[occasion] = (hotDateMap[key].occasions[occasion] || 0) + 1;
      }
    });

    // Convert to array and add heat level + top occasion
    const hotDates = Object.values(hotDateMap).map(hd => {
      const topOccasion = Object.entries(hd.occasions).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
      return {
        date: hd.date,
        heatLevel: Math.min(100, hd.count * 10), // simple % formula
        totalViews: hd.count * 5, // fake metric (replace with real views if you have)
        enquiries: hd.count * 2, // fake metric (replace with real enquiries if you have)
        highestDemandOccasion: topOccasion[0],
        occasionDemandCount: topOccasion[1]
      };
    });

    res.status(200).json({ success: true, data: hotDates });

  } catch (error) {
    console.error("❌ Error generating global hot dates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate hot dates",
      error: error.message
    });
  }
}



    /**
     * Get bookings for a specific user (Frontend booking history)
     */
    async getUserBookings(req, res) {
        try {
            console.log('📊 Getting user bookings...');
            
            const { userId } = req.params;
            const { 
                filterByStatus = 'true',
                filterByDisable = 'false',
                filterByOrderType = 'book_now',
                page = 1,
                limit = 10
            } = req.query;

            console.log('Query parameters:', {
                userId,
                filterByStatus,
                filterByDisable,
                filterByOrderType,
                page,
                limit
            });

            // Build query
            let query = { userId };

            // Filter by booking status (only confirmed and pending, not cancelled)
            if (filterByStatus === 'true') {
                query['details.bookingStatus'] = { $in: ['confirmed', 'pending'] };
            }

            // Filter by order type if specified
            if (filterByOrderType) {
                if (filterByOrderType === 'book_now') {
                    query['details.bookingType'] = { $in: ['online', 'booking'] };
                } else if (filterByOrderType === 'send_enquires') {
                    query['details.bookingType'] = 'enquiry';
                }
            }

            console.log('Final query:', JSON.stringify(query, null, 2));

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Get bookings with pagination
            const bookings = await Booking.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            // Get total count
            const totalCount = await Booking.countDocuments(query);

            console.log(`Found ${bookings.length} bookings out of ${totalCount} total`);

            // Transform bookings to match the venueorder format expected by frontend
            const transformedBookings = bookings.map(booking => {
                // Convert DD/MM/YYYY back to Date objects for frontend processing
                const parseDate = (dateStr) => {
                    if (!dateStr) return null;
                    const [day, month, year] = dateStr.split('/');
                    return new Date(year, month - 1, day);
                };

                const startDate = parseDate(booking.details.startFilterDate);
                const endDate = parseDate(booking.details.endFilterDate);

                return {
                    id: booking._id,
                    venueId: booking.venueId,
                    venueName: booking.venueName,
                    customerId: booking.userId,
                    customerName: booking.userName,
                    customerEmail: booking.userEmail,
                    customerContact: booking.userContact,
                    // Duration array to match venueorder format
                    duration: [{
                        occasionStartDate: startDate,
                        occasionEndDate: endDate,
                        slotId: booking.details.eventDuration === 'morning' ? 'morning_slot' : 
                               booking.details.eventDuration === 'evening' ? 'evening_slot' :
                               booking.details.eventDuration === 'night' ? 'night_slot' : 'full_day_slot'
                    }],
                    // Map food types to match venueorder format
                    foodType: booking.details.foodMenuType ? [booking.details.foodMenuType.toLowerCase().replace(' ', '_')] : [],
                    guestCount: parseInt(booking.details.guestCount) || 0,
                    totalAmount: booking.details.totalAmount || 0,
                    // Additional fields for compatibility
                    orderType: booking.details.bookingType === 'online' ? 'book_now' : 'send_enquires',
                    status: booking.details.bookingStatus,
                    paymentStatus: booking.details.paymentStatus,
                    occasion: booking.details.occasion,
                    decorType: booking.details.weddingDecorType,
                    decorPrice: booking.details.weddingDecorPrice || 0,
                    foodPrice: booking.details.foodMenuPrice || 0,
                    bookingNotes: booking.details.bookingNotes,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt,
                    // Analytics fields
                    analytics: {
                        sendEnquiryClicked: booking.details.sendEnquiryClicked || false,
                        clickedOnReserved: booking.details.clickedOnReserved || false,
                        clickedOnBookNow: booking.details.clickedOnBookNow || false,
                        madePayment: booking.details.madePayment || false
                    }
                };
            });

            res.status(200).json({
                success: true,
                data: {
                    items: transformedBookings,
                    totalCount: totalCount,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    hasNextPage: skip + bookings.length < totalCount,
                    hasPrevPage: parseInt(page) > 1
                }
            });

        } catch (error) {
            console.error('❌ Error fetching user bookings:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user bookings',
                error: error.message
            });
        }
    }
}

module.exports = new BookingController();
