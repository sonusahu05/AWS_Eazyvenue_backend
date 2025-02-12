const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
var express = require('express');
var mongoose = require('mongoose');
const Productreview = require('../../../model/Productreview');
const cipher = require('../common/auth/cipherHelper');
const { ObjectID } = require('mongodb');
var moment = require('moment');
// Add All Productreview
router.post("/add", async (req, res) => {
    const productreview = new Productreview({

        sku: req.body.sku,
        reviewHeading: req.body.reviewHeading,
        customerName: req.body.customerName,
        reviewDescription: req.body.reviewDescription,
        reviewImage: req.body.reviewImage,
        rating: req.body.rating,
        email: req.body.email,
        date: req.body.date,
        status: req.body.status,
        approve: req.body.approve,
        disable: false,
    })
    try {
        const savedProductreview = await productreview.save();
        res.send(savedProductreview);
    } catch (error) {
        res.status(404).send(error);
    }
});

// Get All Productreview Listing
router.get("/", async (req, res) => {
    try {
        const copyFilter = { ...req.query };
        copyFilter.query = {};
        if (copyFilter.filterByStatus) {
            copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
        }
        if (req.query.filterByDisable) {
            copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
        }
        const productreviews = await Productreview.find(copyFilter.query);
        res.json(productreviews);
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single Productreview Listing
router.get("/:id", async (req, res) => {
    try {
        const productreview = await Productreview.findById(req.params.id);
        res.json(productreview);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Productreview
router.put("/update/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        let productReviewObj = [];
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                productReviewObj['disable'] = req.body[key];
                productReviewObj['deleted_by'] = ObjectID(userId);
                productReviewObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                productReviewObj['status'] = req.body[key];
            } else if (key == "approve") {
                productReviewObj['approve'] = req.body[key];
            } else {
                productReviewObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, productReviewObj);
        const updatedProductreview = await Productreview.findByIdAndUpdate({ _id: req.params.id }, updateData);
        res.json(updatedProductreview);
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet Productreview
router.delete("/delete/:id", async (req, res) => {
    try {
        const removeProductreview = await Productreview.findByIdAndDelete(req.params.id);
        res.json(removeProductreview);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;