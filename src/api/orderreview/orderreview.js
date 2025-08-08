const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
var express = require('express');
var mongoose = require('mongoose');
const Orderreview = require('../../../model/Orderreview');
const cipher = require('../common/auth/cipherHelper');
const { ObjectID } = require('mongodb');
var moment = require('moment');
// Add All Orderreview
 router.post("/add", async (req, res)=> {
    const orderreview = new Orderreview({
        
        orderID: req.body.orderID,         
        reviewHeading: req.body.reviewHeading, 
        customerName: req.body.customerName,         
        reviewDescription: req.body.reviewDescription, 
        reviewImage: req.body.reviewImage,  
        rating: req.body.rating,  
        email: req.body.email,  
        date: req.body.date,         
        status: req.body.status,
        disable: false,  
    })
    try{
const savedOrderreview = await orderreview.save();
res.send(savedOrderreview);
    } catch (error){
        res.status(404).send(error);
    }
 });

 // Get All Orderreview Listing
 router.get("/", async (req, res)=> { 
    try{
        const copyFilter = { ...req.query };
        copyFilter.query = {};
        if (copyFilter.filterByStatus) {
            copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
        }
        if (req.query.filterByDisable) {
            copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
        }
    const orderreviews = await Orderreview.find(copyFilter.query);  
    res.json(orderreviews);
    } catch (error){
        res.json({ message: error});
    }
 });
// Get Single Orderreview Listing
router.get("/:id", async (req, res)=> { 
    try{
    const orderreview = await Orderreview.findById(req.params.id);  
    res.json(orderreview);
    } catch (error){
        res.json({ message: error});
    }
 });

// Update Orderreview
router.put("/update/:id", async (req, res)=> { 
    try{
        const userId = cipher.getUserFromToken(req);
        let orderReviewObj = [];
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                orderReviewObj['disable'] = req.body[key];
                orderReviewObj['deleted_by'] = ObjectID(userId);
                orderReviewObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                orderReviewObj['status'] = req.body[key];
            } else {
                orderReviewObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, orderReviewObj);
    const updatedOrderreview = await Orderreview.findByIdAndUpdate({_id:req.params.id}, updateData);
    res.json(updatedOrderreview);
    } catch (error){
        res.json({ message: error});
    }
 });

//Delet Orderreview
router.delete("/delete/:id", async (req, res)=> {
    try{
         const removeOrderreview = await Orderreview.findByIdAndDelete(req.params.id);
        res.json(removeOrderreview);
        } catch (error){
            res.json({ message: error});
        }
     });

module.exports = router;