const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const razorTransactionSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    entity:{
        type:String
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['captured', 'authorized', 'failed','pending','refunded'],
        default: 'pending',
    },
    order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: true,
    },
    razorpay_invoice_id: {
        type: String
    },
    international: {
        type: Boolean
    },
    method:{
        type : String
    },
    amount_refunded: {
        type: Number 
    },
    refund_status: {
        type: String
    },
    captured: {
        type: Boolean
    },
    description: {
        type: String
    },
    card_id:{ 
        type: String
    },
    bank: {
        type: String
    },
    wallet :{
        type: String
    },
    vpa: {
        type: String
    },
    email: {
        type: String
    },
    contact: {
        type: String
    },
    customer_id: {
        type: String
    },
    token_id: {
        type: String
    },
    notes: {
        type: Array
    },
    fee: {
        type: Number
    },
    tax: {
        type: Number
    },
    acquirer_data: {
      type: Object
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model("razortransaction", razorTransactionSchema);