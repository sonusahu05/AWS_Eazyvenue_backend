const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const ContactUs = require('../../../model/ContactUs');
const ContactUsService = require('./contactUsService');
const contactUsService = new ContactUsService();
const { ObjectID } = require('mongodb');
var moment = require('moment');
// Add All News Letter
router.post("/add", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const contactUs = new ContactUs({
        name: req.body.name,
        phoneNumber: req.body.mobileNumber,
        message: req.body.message,
        email: req.body.email,
        status: true,
        disable: false,
    })
    try {
        const savedContactUs = await contactUs.save();
        res.send(savedContactUs);
    } catch (error) {
        res.status(404).send(error);
    }
});


// Update Contact us
router.put("/update/:id", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const contactUsObj = [];
    const newsLetterId = req.params.id;
    contactUsObj['updated_by'] = ObjectID(userId);
    contactUsObj['updated_at'] = moment.utc().toDate();
    for (var key in req.body) {
        if (key == "disable") {
            contactUsObj['disable'] = req.body.disable;
            contactUsObj['deleted_by'] = ObjectID(userId);
            contactUsObj['deleted_at'] = moment.utc().toDate();
        } else if (key == "status") {
            contactUsObj['status'] = req.body[key];
        } else {
            contactUsObj[key] = req.body[key];
        }
    }
    const updateData = Object.assign({}, contactUsObj);
    const updateContactUs = await contactUsService.updateContactUs(newsLetterId, updateData).then(newsLetterData => {
        res.json({ message: "Data Updated Successfully", data: newsLetterData });
    });
});

// Get All News Letter Listing
router.get("/", async (req, res) => {
    try {
        contactUsService
            .list(req.query)
            .then(banner => {
                res.json({ totalCount: banner.length, data: banner });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single News Letter Listing
router.get("/:id", async (req, res) => {
    try {
        const contactUs = await ContactUs.findById(req.params.id);
        res.json(contactUs);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;