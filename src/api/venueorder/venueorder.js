const router = require("express").Router();
const Venueorder = require("../../../model/Venueorder");
const Booking = require("../../../model/Booking");
const Venue = require("../../../model/Venue");
const Category = require("../../../model/Category");
const Slot = require("../../../model/Slot");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const VenueorderService = require('./venueorderService');
const venueorderService = new VenueorderService();
const { ObjectId } = require('mongodb');
var moment = require('moment');
const { payment } = require('config');
const User = require("../../../model/User");
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { sendCheckAvailibilityMail,sendVenueBookingMail } = require("../../utils/mail");
const { default: axios } = require("axios");
const RazorTransaction = require("../../../model/RazorTransaction");

// router.get("/test",async(req,res) =>{
//     try{
//         const data = {
//             to: 'maathesh@eazyvenue.com',
//             venue: 'ABC Test Venue',
//             occasion: 'Wedding',
//             guestCount: '500',
//             dates: '22/12/2023 - 22/12/2023',
//             slot: 'Evening',
//             foodType: 'Veg',
//             plateType: '1X1',
//             decorationType: 'Floral'
//         }
//         sendCheckAvailibilityMail(data);
//         res.json({message:"Send"})
//     }catch(err){
//         res.status(500).json({message: err.message})
//     }
// })
// Add All Venue Order
router.post("/", auth, async (req, res) => {
    console.log('🚀 VENUE ORDER: POST request received');
    console.log('🚀 VENUE ORDER: Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        console.log('🔍 VENUE ORDER: Step 1 - Getting user from token');
        const userId = cipher.getUserFromToken(req);
        console.log('✅ VENUE ORDER: User ID extracted:', userId);
        
        console.log('🔍 VENUE ORDER: Step 2 - Processing vendors');
        var vendors = req.body.vendors;
        console.log('📊 VENUE ORDER: Raw vendors:', vendors);
        var vendorarr = [];
        if (vendors && Array.isArray(vendors)) {
            vendors.forEach((element) => {
                vendorarr.push({ "id": ObjectId(element) });
            });
        }
        console.log('✅ VENUE ORDER: Processed vendors array:', vendorarr);
        
        console.log('🔍 VENUE ORDER: Step 3 - Processing food types');
        var foodType = req.body.foodType;
        console.log('📊 VENUE ORDER: Raw foodType:', foodType);
        var foodTypearr = [];
        if (foodType && Array.isArray(foodType)) {
            foodType.forEach((element) => {
                foodTypearr.push({ "slug": element });
            });
        }
        console.log('✅ VENUE ORDER: Processed foodType array:', foodTypearr);

        console.log('🔍 VENUE ORDER: Step 4 - Processing food menu types');
        var foodMenuType = req.body.foodMenuType;
        console.log('📊 VENUE ORDER: Raw foodMenuType:', foodMenuType);
        var foodMenuTypearr = [];
        if (foodMenuType && Array.isArray(foodMenuType)) {
            foodMenuType.forEach((element) => {
                foodMenuTypearr.push({ "slug": element });
            });
        }
        console.log('✅ VENUE ORDER: Processed foodMenuType array:', foodMenuTypearr);
        
        console.log('🔍 VENUE ORDER: Step 5 - Processing duration data');
        var durationData = req.body.durationData;
        console.log('📊 VENUE ORDER: Raw durationData:', durationData);
        var durationDataarr = [];
        if (durationData && Array.isArray(durationData)) {
            durationData.forEach((element) => {
                console.log('🔄 VENUE ORDER: Processing duration element:', element);
                durationDataarr.push({ 
                    "occasionStartDate": moment(element.occasionStartDate).utc(), 
                    "occasionEndDate": moment(element.occasionEndDate).utc(), 
                    "slotId": ObjectId(element.slotId) 
                });
            });
        }
        console.log('✅ VENUE ORDER: Processed duration array:', durationDataarr);
        
        console.log('🔍 VENUE ORDER: Step 6 - Creating venue order object');
        const venueorderObj = new Venueorder({
            customerId: req.body.customerId,
            venueId: req.body.venueId,
            categoryId: req.body.categoryId,
            //occasionDate: moment(occasionDate).utc(),
            orderType: req.body.orderType,
            duration: durationDataarr,
            guestcnt: req.body.guestcnt,
            foodMenuType: req.body.foodMenuType,
            foodType: req.body.foodType,
            bookingPrice: req.body.bookingPrice,
            //slotId: req.body.venue_slots,
            decor: req.body.decor,
            decorName: req.body.decorName,
            vendors: vendorarr,
            price: req.body.price,
            status: req.body.status,
            disable: req.body.disable,
            created_by: userId,
            paymentType: req.body.paymentType
        });
        console.log('✅ VENUE ORDER: Venue order object created:', JSON.stringify(venueorderObj, null, 2));
        
        console.log('🔍 VENUE ORDER: Step 7 - Getting user details');
        const userDetails = await User.findById(userId);
        console.log('✅ VENUE ORDER: User details:', userDetails ? 'Found' : 'Not found');
        
        console.log('🔍 VENUE ORDER: Step 8 - Initializing Razorpay');
        const rzp_instance = new Razorpay({ key_id: payment.liveKey, key_secret: payment.liveSecret }); //live
        console.log('✅ VENUE ORDER: Razorpay instance created');
        
        console.log('🔍 VENUE ORDER: Step 9 - Getting venue data');
        const venueData = await Venue.findById(venueorderObj.venueId);
        console.log('✅ VENUE ORDER: Venue data:', venueData ? 'Found' : 'Not found');
        
        console.log('🔍 VENUE ORDER: Step 10 - Getting occasion data');
        const occasionData = await Category.findById(venueorderObj.categoryId);
        console.log('✅ VENUE ORDER: Occasion data:', occasionData ? 'Found' : 'Not found');
        
        console.log('🔍 VENUE ORDER: Step 11 - Processing dates');
        const startDate = new Date(venueorderObj.duration[0].occasionStartDate);
        const endDate = new Date(venueorderObj.duration[0].occasionEndDate);
        const formattedStartDate = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}`;
        const formattedEndDate = `${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`;
        const dates = `${formattedStartDate} - ${formattedEndDate}`;
        const guestCount = venueorderObj.guestcnt;
        console.log('✅ VENUE ORDER: Dates processed:', { formattedStartDate, formattedEndDate, guestCount });
        
        console.log('🔍 VENUE ORDER: Step 12 - Getting slot data');
        const slotData = await Slot.findById(venueorderObj.duration[0].slotId);
        console.log('✅ VENUE ORDER: Slot data:', slotData ? 'Found' : 'Not found');
        
        console.log('🔍 VENUE ORDER: Step 13 - Processing food type');
        let foodTypeCategory = null;
        if(venueorderObj.foodType[0] != null){
            foodTypeCategory = await Category.find({slug: venueorderObj.foodType[0]});
        }
        console.log('✅ VENUE ORDER: Food type processed:', foodTypeCategory ? 'Found' : 'Null/Not found');
        
        const plateType = venueorderObj.foodMenuType.length > 0 ? venueorderObj.foodMenuType[0] : 'NA';
        const decor = req.body.decorType;
        console.log('✅ VENUE ORDER: Plate type and decor:', { plateType, decor });

        console.log('🔍 VENUE ORDER: Step 14 - Checking user profile completeness');
        //check whether user if filled the profile
        if(userDetails && userDetails.firstName && userDetails.lastName && userDetails.email){
            console.log("📨 VENUE ORDER: User profile complete, sending availability email to:", userDetails.email);
            
            console.log('🔍 VENUE ORDER: Step 15 - Preparing CRM data');
            const crmData = {
                "Lead Name" : userDetails.firstName + ' ' + userDetails.lastName,
                "Number of Guest" : guestCount,
                "Preferred Location" : venueData.cityname,
                "Type of Event" : occasionData.name,
                "Date of Event" : formattedStartDate,
                "Menu" : foodTypeCategory != null ? foodTypeCategory[0].name : "NA",
                "Venue" : venueData.name,
                "Number" : userDetails.mobileNumber, 
                "Email" : userDetails.email,
                "Requirement": formattedStartDate + ', '+ occasionData.name + ", "+ venueData.name + ", "+ " No of guest : "+ guestCount + ', '+ venueData.cityname,
                "User_Action" : req.body.orderType === 'book_now' ? "venue_booking" : "venue_inquiry"
            };
            console.log('✅ VENUE ORDER: CRM data prepared:', JSON.stringify(crmData, null, 2));
            
            console.log('🔍 VENUE ORDER: Step 16 - Sending CRM data to external API');
            axios.post('https://teleduce.corefactors.in/lead/apiwebhook/e355659f-b2da-4d96-8899-14c11ae71fa7/Eazyvenuecom/',crmData).then((data)=>{
                console.log('✅ VENUE ORDER: Lead Added to CRM successfully');
            }).catch((e)=>{
                console.error('❌ VENUE ORDER: CRM API Error:', e.message);
            });

            console.log('🔍 VENUE ORDER: Step 17 - Adding venue order to database');
            venueorderService.addvenueorder(venueorderObj).then(venueOrder => {
                console.log('✅ VENUE ORDER: Venue order added successfully:', venueOrder.insertedId);
                
                if(req.body.orderType === 'book_now'){
                    console.log('🔍 VENUE ORDER: Step 18 - Creating Razorpay order for book_now');
                    console.log('💰 VENUE ORDER: Booking price:', req.body.bookingPrice);
                    
                    rzp_instance.orders.create({
                        // amount: parseInt(100),
                        amount: parseInt(req.body.bookingPrice * 100),
                        currency: "INR",
                        receipt: "receipt_" + venueOrder.insertedId,
                        notes: {
                            food: foodTypeCategory && foodTypeCategory[0] ? foodTypeCategory[0].name : 'NA',
                            decor: decor ?? ''
                        }
                    }, (err, order) =>{
                        console.log('🔍 VENUE ORDER: Step 19 - Razorpay order creation callback');
                        if(err){
                            console.error('❌ VENUE ORDER: Razorpay order creation error:', err);
                            res.status(500).json({message: err.message});
                            return;
                        }
                        
                        console.log('✅ VENUE ORDER: Razorpay order created successfully:', order);
                        const order_data = order;
                        const response = {
                            amount: order_data.amount,
                            currency: "INR",
                            order_id: order_data.id,//create order id
                            venueOrderId: venueOrder.insertedId,
                            name: 'Eazyvenue',
                            description: 'Payment for Venue booking',
                            // image: 'https://eazyvenue.com/assets/images/eazyvneu-logo.svg',
                            image: 'https://eazyvenue.com/assets/images/logo.png',
                            prefill: {
                                name: userDetails.firstName + ' ' + userDetails.lastName,
                                email: userDetails.email,
                                contact: userDetails.mobileNumber
                            },
                            theme: {
                                color: '#F37254'
                            }
                        };
                        console.log('✅ VENUE ORDER: Sending response to frontend:', JSON.stringify(response, null, 2));
                        res.status(200).json(response);
                    });
                }else{
                    //save enquiry and send mail
                    console.log('🔍 VENUE ORDER: Step 18 - Processing enquiry (not book_now)');
                    
                    const data = {
                        to: userDetails.email,
                        venue: venueData.name,
                        occasion: occasionData.name,
                        guestCount: guestCount,
                        dates: dates,
                        slot: slotData ? slotData.slot : "NA",
                        foodType:  foodTypeCategory != null ? foodTypeCategory[0].name : "NA",
                        plateType: plateType,
                        decorationType: decor,
                        venueImage: venueData.venueImage[0].venue_image_src,
                        userName: userDetails.firstName + ' ' + userDetails.lastName,
                        userMobile: userDetails.mobileNumber
                    };
                    console.log('📧 VENUE ORDER: Sending enquiry email with data:', JSON.stringify(data, null, 2));
                    sendCheckAvailibilityMail(data);
                    console.log('✅ VENUE ORDER: Enquiry processed successfully');
                    res.json({ message: "Data Inserted Successfully", id: venueOrder.insertedId });
                }
            })
            .catch(err => {
                console.error('❌ VENUE ORDER: Error in addvenueorder:', err);
                res.status(400).send({ error: err.message });
            });
        }else{
            console.log('❌ VENUE ORDER: User profile incomplete');
            res.status(200).send({message: "no profile", mode: "profile-info"});
        }

    } catch (error) {
        console.error('❌ VENUE ORDER: Critical error in POST /venueorder:', error);
        console.error('❌ VENUE ORDER: Error stack:', error.stack);
        res.status(500).send({ error: error.message, stack: error.stack });
    }
});

router.post("/", auth, async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    //var occasionDate = new Date(req.body.occasionDate);
    var vendors = req.body.vendors;
    var vendorarr = [];
    vendors.forEach((element) => {
        vendorarr.push({ "id": ObjectId(element) });
    });
    var foodType = req.body.foodType;
    var foodTypearr = [];
    foodType.forEach((element) => {
        foodTypearr.push({ "slug": element });
    });

    var foodMenuType = req.body.foodMenuType;
    var foodMenuTypearr = [];
    foodMenuType.forEach((element) => {
        foodMenuTypearr.push({ "slug": element });
    });
    // console.log(vendorarr);
    // return;
    var durationData = req.body.durationData;
    var durationDataarr = [];
    durationData.forEach((element) => {
        durationDataarr.push({ "occasionStartDate": moment(element.occasionStartDate).utc(), "occasionEndDate": moment(element.occasionEndDate).utc(), "slotId": ObjectId(element.slotId) });
    });
    // console.log(req.body.guestcnt);
    const venueorderObj = new Venueorder({
        customerId: req.body.customerId,
        venueId: req.body.venueId,
        categoryId: req.body.categoryId,
        //occasionDate: moment(occasionDate).utc(),
        orderType: req.body.orderType,
        duration: durationDataarr,
        guestcnt: req.body.guestcnt,
        foodMenuType: req.body.foodMenuType,
        foodType: req.body.foodType,
        bookingPrice: req.body.bookingPrice,
        //slotId: req.body.venue_slots,
        decor: req.body.decor,
        decorName: req.body.decorName,
        vendors: vendorarr,
        price: req.body.price,
        status: req.body.status,
        disable: req.body.disable,
        created_by: userId,
        paymentType: req.body.paymentType
    })
    console.log(venueorderObj);
    const userDetails = await User.findById(userId);
    const rzp_instance = new Razorpay({ key_id: payment.liveKey, key_secret: payment.liveSecret }) //live
    //const rzp_instance = new Razorpay({ key_id: "rzp_test_Om8utusPt9w5WV", key_secret: "1KKBt3BL89yXfCtDiytDcEeW" }) //test
    try {
        // const savedVenueorder = await venueorderObj.save();
        // res.send(savedVenueorder);
        const venueData = await Venue.findById(venueorderObj.venueId);
        const occasionData = await Category.findById(venueorderObj.categoryId);
        const startDate = new Date(venueorderObj.duration[0].occasionStartDate);
        const endDate = new Date(venueorderObj.duration[0].occasionEndDate);
        const formattedStartDate = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}`;
        const formattedEndDate = `${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`;
        const dates = `${formattedStartDate} - ${formattedEndDate}`;
        const guestCount = venueorderObj.guestcnt;
        const slotData = await Slot.findById(venueorderObj.duration[0].slotId);
        let foodType = null;
        if(venueorderObj.foodType[0] != null){
            foodType = await Category.find({slug: venueorderObj.foodType[0]});
        }
        const plateType = venueorderObj.foodMenuType.length > 0 ? venueorderObj.foodMenuType[0] : 'NA';
        const decor = req.body.decorType;

        //check whether user if filled the profile
        if(userDetails && userDetails.firstName && userDetails.lastName && userDetails.email){
            console.log("📨 Sending availability email to:", userDetails.email);
            const crmData = {
                "Lead Name" : userDetails.firstName + ' ' + userDetails.lastName,
                "Number of Guest" : guestCount,
                "Preferred Location" : venueData.cityname,
                "Type of Event" : occasionData.name,
                "Date of Event" : formattedStartDate,
                "Menu" : foodType != null ? foodType[0].name : "NA",
                "Venue" : venueData.name,
                "Number" : userDetails.mobileNumber, 
                "Email" : userDetails.email,
                "Requirement": formattedStartDate + ', '+ occasionData.name + ", "+ venueData.name + ", "+ " No of guest : "+ guestCount + ', '+ venueData.cityname,
                "User_Action" : req.body.orderType === 'book_now' ? "venue_booking" : "venue_inquiry"
            }
            
            axios.post('https://teleduce.corefactors.in/lead/apiwebhook/e355659f-b2da-4d96-8899-14c11ae71fa7/Eazyvenuecom/',crmData).then((data)=>{
                console.log('Lead Added');
            }).catch((e)=>{
                console.error(e);
            });

            venueorderService.addvenueorder(venueorderObj).then(venueOrder => {
                if(req.body.orderType === 'book_now'){
                    rzp_instance.orders.create({
                        // amount: parseInt(100),
                        amount: parseInt(req.body.bookingPrice * 100),
                        currency: "INR",
                        receipt: "receipt_" + venueOrder.insertedId,
                        notes: {
                            food: foodType[0].name,
                            decor: decor ?? ''
                        }
                    }, (err, order) =>{
                        console.log(order);
                        if(err){
                            res.status(500).json({message: err.message})
                        }
                        const order_data = order;
                        const response = {
                            amount: order_data.amount,
                            currency: "INR",
                            order_id: order_data.id,//create order id
                            venueOrderId: venueOrder.insertedId,
                            name: 'Eazyvenue',
                            description: 'Payment for Venue booking',
                            // image: 'https://eazyvenue.com/assets/images/eazyvneu-logo.svg',
                            image: 'https://eazyvenue.com/assets/images/logo.png',
                            prefill: {
                                name: userDetails.firstName + ' ' + userDetails.lastName,
                                email: userDetails.email,
                                contact: userDetails.mobileNumber
                            },
                            theme: {
                                color: '#F37254'
                            }
                        }
                       
    
                        res.status(200).json(response)
                    })
                }else{
                    //save enquiry and send mail
                    // console.log(JSON.stringify(venueorderObj));
                    
                    const data = {
                        to: userDetails.email,
                        venue: venueData.name,
                        occasion: occasionData.name,
                        guestCount: guestCount,
                        dates: dates,
                        slot: slotData ? slotData.slot : "NA",
                        foodType:  foodType != null ? foodType[0].name : "NA",
                        plateType: plateType,
                        decorationType: decor,
                        venueImage: venueData.venueImage[0].venue_image_src,
                        userName: userDetails.firstName + ' ' + userDetails.lastName,
                        userMobile: userDetails.mobileNumber
                    }
                    sendCheckAvailibilityMail(data);
                    res.json({ message: "Data Inserted Successfully", id: venueOrder.insertedId });
                }
            })
                .catch(err => {
                    console.log(err);
                    res.status(400).send({ error: err.message })
                });
        }else{
            res.status(200).send({message: "no profile", mode: "profile-info"})
        }

       
    } catch (error) {
        res.status(404).send(error.message);
    }
});

router.post("/verifyPayment", auth, async(req,res)=>{
    try{
        const key = "rzp_test_Om8utusPt9w5WV"; //test key
        const secret = "1KKBt3BL89yXfCtDiytDcEeW"; //test secret
        const userId = cipher.getUserFromToken(req);
        const order_id = req.body.razorpay_order_id;
        const payment_id = req.body.razorpay_payment_id;
        const signature = req.body.razorpay_signature;
        const order_status = req.body.status_code;
        const venueOrderId = req.body.venueOrderId;
        const orderType = req.body.orderType;
        // console.log(req.body);
        // const hmac = crypto.createHmac('sha256',secret); //test
        const hmac = crypto.createHmac('sha256',payment.liveSecret);
        hmac.update(`${order_id}|${payment_id}`)
        const generatedSignature = hmac.digest('hex');
        if(generatedSignature === signature){
            const rzp_instance = new Razorpay({ key_id: payment.liveKey, key_secret: payment.liveSecret }) //live
            //const rzp_instance = new Razorpay({ key_id: key, key_secret: secret }) //test
            rzp_instance.payments.fetch(payment_id)
            .then(async(payment) =>{
                //save RazorpayTransaction 
                // console.log(payment);
                if(payment.error){
                    res.status(500).json({message: payment.error.description})
                }
                let razorpayTxnData = {
                    user : ObjectId(userId),
                    razorpay_order_id: payment.order_id,
                    razorpay_payment_id: payment.id,
                    razorpay_invoice_id: payment.invoice_id,
                    ...payment
                }
                // Object.keys(payment).forEach(key => {
                //     if (razorpayTxnData.hasOwnProperty(key)) {
                //         if(key == 'order_id'){
                //             razorpayTxnData.razorpay_order_id = payment[key];    
                //         }
                //         if(key == 'id'){
                //             razorpayTxnData.razorpay_payment_id = payment[key];    
                //         }
                //         if(key == 'invoice_id'){
                //             razorpayTxnData.razorpay_invoice_id = payment[key];    
                //         }
                //         razorpayTxnData[key] = payment[key];
                //     }
                // });
                // console.log(razorpayTxnData);
                await RazorTransaction.insertMany([razorpayTxnData]);
                if(payment.status === 'captured'){
                    
                    if(orderType === 'venue'){
                        const venueOrder = await Venueorder.findById(venueOrderId);
                        const userDetails = await User.findById(userId);
                        const venueData = await Venue.findById(venueOrder.venueId)
                        const occasionData = await Category.findById(venueOrder.categoryId);
                        const startDate = new Date(venueOrder.duration[0].occasionStartDate);
                        const endDate = new Date(venueOrder.duration[0].occasionEndDate);
                        const formattedStartDate = `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}`;
                        const formattedEndDate = `${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`;
                        const dates = `${formattedStartDate} - ${formattedEndDate}`;
                        const slotData = await Slot.findById(venueOrder.duration[0].slotId);
                        const foodType = await Category.find({slug: venueOrder.foodType[0]});
                        const plateType = venueOrder.foodMenuType[0];
                        
                        // 🆕 CREATE BOOKING RECORD IN NEW BOOKINGS COLLECTION
                        console.log('📝 PAYMENT: Creating booking record in bookings collection...');
                        try {
                            // Map slot information to event duration
                            let eventDuration = null;
                            if (slotData && slotData.slot) {
                                const slotName = slotData.slot.toLowerCase();
                                if (slotName.includes('morning') || slotName.includes('am')) {
                                    eventDuration = 'morning';
                                } else if (slotName.includes('evening') || slotName.includes('pm')) {
                                    eventDuration = 'evening';
                                } else if (slotName.includes('night')) {
                                    eventDuration = 'night';
                                } else if (slotName.includes('full') || slotName.includes('whole')) {
                                    eventDuration = 'full';
                                }
                            }

                            // Map food menu plate information
                            let foodMenuPlate = null;
                            if (plateType && ['1x1', '2x2', '3x3'].includes(plateType)) {
                                foodMenuPlate = plateType;
                            }

                            const bookingData = {
                                venueId: venueOrder.venueId,
                                venueName: venueData.name,
                                userId: userId,
                                userName: userDetails.firstName + ' ' + userDetails.lastName,
                                userContact: userDetails.mobileNumber,
                                userEmail: userDetails.email,
                                details: {
                                    isBookedByAdmin: false,
                                    startFilterDate: formattedStartDate,
                                    endFilterDate: formattedEndDate,
                                    eventDuration,
                                    occasion: occasionData.name,
                                    weddingDecorType: venueOrder.decorName || null,
                                    weddingDecorPrice: venueOrder.decor || 0,
                                    foodMenuType: foodType && foodType[0] ? foodType[0].name : null,
                                    foodMenuPrice: venueOrder.foodPrice || 0,
                                    foodMenuPlate,
                                    guestCount: String(venueOrder.guestcnt),
                                    bookingType: 'online',
                                    bookingStatus: 'confirmed',
                                    bookingNotes: `Payment completed via Razorpay. Order ID: ${payment.order_id}, Payment ID: ${payment.id}`,
                                    totalAmount: venueOrder.price || 0,
                                    paymentStatus: 'paid',
                                    // Analytics tracking fields
                                    sendEnquiryClicked: false,
                                    clickedOnReserved: false,
                                    clickedOnBookNow: true,
                                    madePayment: true
                                },
                                createdBy: userId
                            };

                            const booking = new Booking(bookingData);
                            const savedBooking = await booking.save();
                            console.log('✅ PAYMENT: Booking record created successfully:', savedBooking._id);
                        } catch (bookingError) {
                            console.error('❌ PAYMENT: Failed to create booking record:', bookingError);
                            // Don't fail the payment verification even if booking creation fails
                            // The venueorder record still exists as fallback
                        }

                        const data = {
                            to: userDetails.email,
                            venue: venueData.name,
                            venueImage: venueData.venueImage[0].venue_image_src,
                            occasion: occasionData.name,
                            guestCount: venueOrder.guestcnt,
                            dates: dates,
                            slot: slotData.slot,
                            foodType: foodType[0].name,
                            plateType: plateType,
                            decorationType: venueOrder.decorName,
                            totalAmount: venueOrder.price,
                            paidAmount:venueOrder.bookingPrice,
                            pendingAmount: venueOrder.price - venueOrder.bookingPrice
                        }
                        sendVenueBookingMail(data);
                    }
                    res.status(200).json({status:"Success",message:"Payment Recieved", venueOrder: await Venueorder.findById(venueOrderId)});
                }
                if(payment.status === 'authorized'){
                    res.status(200).json({status:"authorized",message:"Payment authorized but not yet recieved"});
                }
                if(payment.status === 'failed'){
                    res.status(200).json({status:"failed",message:"Payment Failed"});
                }
                //refunded status=refunded
                if(payment.status === 'pending'){
                    res.status(200).json({status:"pending",message:"Payment pending"});
                }
            }).catch(err =>{
                console.error('Razorpay API Error:', err);
                res.status(500).json({message: err.message})
            })
        }else{
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

// Update Venue Order
router.put("/:id", auth, async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const venueorderObj = [];
    //console.log(req.body.comment);
    //return;
    const venueorderId = req.params.id;
    venueorderObj['updated_by'] = ObjectId(userId);
    venueorderObj['updated_at'] = moment.utc().toDate();
    for (var key in req.body) {
        if (key == "disable") {
            venueorderObj['disable'] = req.body.disable;
            venueorderObj['deleted_by'] = ObjectId(userId);
            venueorderObj['deleted_at'] = moment.utc().toDate();
        } else if (key == "status") {
            venueorderObj['status'] = req.body[key];
        } else if (key == "durationData") {
            var durationData = req.body.durationData;
            var durationDataarr = [];
            durationData.forEach((element) => {
                durationDataarr.push({ "occasionDate": moment(element.occasionDate).utc(), "postavailabilityId": ObjectId(element.postavailabilityId), "slotId": ObjectId(element.slotId) });
            });
            venueorderObj[key] = durationDataarr;
        } else {
            venueorderObj[key] = req.body[key];
        }
    }
    const updateData = Object.assign({}, venueorderObj);
    const updateVenueorder = await venueorderService.updateVenueorder(venueorderId, updateData).then(updateVenueorderData => {
        res.json({ message: "Data Updated Successfully", data: updateVenueorderData });
    });
});

// Get All Venue Order Listing
router.get("/", auth, async (req, res) => {
    try {
        venueorderService
            .list(req.query)
            .then(venueOrder => {
                res.json({ totalCount: venueOrder.length, data: venueOrder });
            })
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Venue Order Listing
router.get("/:id", auth, async (req, res) => {
    try {
        const venueOrders = await venueorderService.findById(req.params.id);
        res.json(venueOrders);
    } catch (error) {
        res.json({ message: error });
    }
});

// //Delete Venue Order
// router.delete("/delete/:id", auth, async (req, res)=> {
//     try{
//         const removeAttribute = await NewsLetter.findByIdAndDelete(req.params.id);        
//         res.json(removeAttribute);
//     } catch (error){
//         res.json({ message: error});
//     }
// });

module.exports = router;
