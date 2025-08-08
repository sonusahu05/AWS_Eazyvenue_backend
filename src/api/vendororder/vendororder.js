const router = require('express').Router();
const VendorOrder = require('../../../model/VendorOrder');
const Vendor = require('../../../model/Vendor');
const User = require('../../../model/User');
const RazorTransaction = require('../../../model/RazorTransaction');
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay')
const auth = passport.authenticate('jwt', { session: false });
const crypto = require('crypto');
const { payment } = require('config');


router.post('/', auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const body = req.body;
        if (!body) {
            res.status(500).json({ message: 'Not valid request' })
        }
        let order = {};
        order.customerId = ObjectId(userId);
        order.vendorId = ObjectId(body.vendorId);
        order.vendorCategoryId = ObjectId(body.vendorCategoryId);
        order.orderType = body.orderType;
        order.occasionId = ObjectId(body.occasionId);
        order.duration = {
            occasionStartDate: new Date(body.duration.occasionStartDate),
            occasionEndDate: new Date(body.duration.occasionEndDate)
        };
        order.timeSlot = body.timeSlot;
        order.services = body.services;
        order.coupon = body.coupon;
        order.amount = body.amount;
        order.totalAmount = body.totalAmount;

        const result = await VendorOrder.insertMany([order]);

        const userDetails = await User.findById(userId);
        const rzp_instance = new Razorpay({ key_id: payment.liveKey, key_secret: payment.liveSecret }) //live
        // const rzp_instance = new Razorpay({ key_id: "rzp_test_Om8utusPt9w5WV", key_secret: "1KKBt3BL89yXfCtDiytDcEeW" }) //test
        rzp_instance.orders.create({
            amount: result[0].amount,
            currency: "INR",
            receipt: "receipt_" + result[0]._id,
            notes: {
                key1: "value3",
                key2: "value2"
            }
        }, (err, order) => {
            console.log(order);
            if(err){
                res.status(500).json({message: err.message})
            }
            const order_data = order;
            const response = {
                amount: order_data.amount,
                currency: "INR",
                order_id: order_data.id,//create order id
                name: 'Eazyvenue',
                description: 'Payment for Vendor Services',
                // image: 'https://eazyvenue.com/assets/images/eazyvneu-logo.svg',
                image: 'https://eazyvenue.com/assets/images/logo.png',
                prefill: {
                    name: userDetails.fullName,
                    email: userDetails.email,
                    contact: userDetails.mobileNumber
                },
                theme: {
                    color: '#F37254'
                }
            }
            res.status(200).json(response)
        })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.post("/verifyPayment", auth, async(req,res)=>{
    try{
        const key = "rzp_test_Om8utusPt9w5WV"; //test key
        const secret = "1KKBt3BL89yXfCtDiytDcEeW"; //test secret
        const userId = cipher.getUserFromToken(req);
        const order_id = req.body.razorpay_order_id;
        const payment_id = req.body.razorpay_payment_id;
        const signature = req.body.razorpay_signature;
        const order_status = req.body.status_code;
        
        // const hmac = crypto.createHmac('sha256',secret); //test
        const hmac = crypto.createHmac('sha256',payment.liveSecret);
        hmac.update(`${order_id}|${payment_id}`)
        const generatedSignature = hmac.digest('hex');
        if(generatedSignature === signature){
            const rzp_instance = new Razorpay({ key_id: payment.liveKey, key_secret: payment.liveSecret }) //live
            // const rzp_instance = new Razorpay({ key_id: key, key_secret: secret }) //test
            rzp_instance.payments.fetch(payment_id)
            .then(async(payment) =>{
                //save RazorpayTransaction 
                if(payment.error){
                    res.status(500).json({message: payment.error.description})
                }
                let razorpayTxnData = {
                    user : ObjectId(userId),
                }
                Object.keys(payment).forEach(key => {
                    if (razorpayTxnData.hasOwnProperty(key)) {
                        if(key == 'order_id'){
                            razorpayTxnData.razorpay_order_id = payment[key];    
                        }
                        if(key == 'id'){
                            razorpayTxnData.razorpay_payment_id = payment[key];    
                        }
                        if(key == 'invoice_id'){
                            razorpayTxnData.razorpay_invoice_id = payment[key];    
                        }
                        razorpayTxnData[key] = payment[key];
                    }
                });
                await RazorTransaction.insertMany([razorpayTxnData]);
                if(payment.status === 'captured'){
                    res.status(200).json({status:"Success",message:"Payment Recieved"});
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

router.get('/:id', auth, async (req, res) => {

})

module.exports = router;