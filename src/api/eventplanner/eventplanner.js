const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const Eventplanner = require('../../../model/Eventplanner');
const EventplannerService = require('./eventplannerService');
const eventplannerService = new EventplannerService();
const { ObjectId } = require('mongodb');
var moment = require('moment');
// Add All News Letter
router.post("/", async (req, res) => {
    const userId = cipher.getUserFromToken(req);    
    const eventplannerObj = new Eventplanner({
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        eventdate: req.body.eventdate,
        email: req.body.email,
        guestcnt: req.body.guestcnt,
        status: true,
        disable: false,
    })
    try {        
        await eventplannerService.add(eventplannerObj)
                .then(eventplanner => {
                    res.json({ message: "Data Inserted Successfully", id: eventplanner.insertedId });
                })
                .catch(err => res.status(400).send({ error: err.message }));
    } catch (error) {
        res.status(404).send(error);
    }
});

// Update 
router.put("/:id", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const eventplannerObj = [];
    const eventplannerId = req.params.id;
    eventplannerObj['updated_by'] = ObjectId(userId);
    eventplannerObj['updated_at'] = moment.utc().toDate();
    for (var key in req.body) {
        if (key == "disable") {
            eventplannerObj['disable'] = req.body.disable;
            eventplannerObj['deleted_by'] = ObjectId(userId);
            eventplannerObj['deleted_at'] = moment.utc().toDate();
        } else if (key == "status") {
            eventplannerObj['status'] = req.body[key];
        } else {
            eventplannerObj[key] = req.body[key];
        }
    }
    const updateData = Object.assign({}, eventplannerObj);
    const updateContactUs = await eventplannerService.update(eventplannerId, updateData).then(eventplannerData => {
        res.json({ message: "Data Updated Successfully", data: eventplannerData });
    });
});

// Get All 
router.get("/", async (req, res) => {
    try {
        eventplannerService
            .list(req.query)
            .then(eventplanner => {
                res.json({ totalCount: eventplanner.length, data: eventplanner });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single News Letter Listing
router.get("/:id", async (req, res) => {
    try {
        const eventplanner = await eventplannerService.findById(req.params.id);
        res.json(eventplanner);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;