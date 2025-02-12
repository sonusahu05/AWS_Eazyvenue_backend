const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const NewsLetter = require('../../../model/NewsLetter');
const NewsLetterService = require('./newsLetterService');
const newsLetterService = new NewsLetterService();
const { ObjectID } = require('mongodb');
var moment = require('moment');
// Add All News Letter
router.post("/add", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    var fullname = "";
    if (req.body.firstName != undefined && req.body.lastName != undefined) {
        fullname = req.body.firstName + ' ' + req.body.lastName;
    }
    const newsLetter = new NewsLetter({
        fullName: fullname,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        status: true,
        disable: false,
    })
    try {
        const savedNewsLetter = await newsLetter.save();
        res.send(savedNewsLetter);
    } catch (error) {
        //res.status(404).send(error);
        console.log(error);
        if (11000 === error.code || 11001 === error.code) {
            res.status(400).send({ message: "Email Id already registered with us" });
        } else {
            res.status(404).send(error);
        }
    }
});

// Update News letter
router.put("/update/:id", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const newsLetterObj = [];
    const newsLetterId = req.params.id;
    newsLetterObj['updated_by'] = ObjectID(userId);
    newsLetterObj['updated_at'] = moment.utc().toDate();
    for (var key in req.body) {
        if (key == "disable") {
            newsLetterObj['disable'] = req.body.disable;
            newsLetterObj['deleted_by'] = ObjectID(userId);
            newsLetterObj['deleted_at'] = moment.utc().toDate();

        } else if (key == "status") {
            newsLetterObj['status'] = req.body[key];
        } else {
            newsLetterObj[key] = req.body[key];
        }
    }
    const updateData = Object.assign({}, newsLetterObj);
    const updateNewsLetter = await newsLetterService.updateNewsLetter(newsLetterId, updateData).then(newsLetterData => {
        res.json({ message: "Data Updated Successfully", data: newsLetterData });
    });
});



// Get All News Letter Listing
router.get("/", async (req, res) => {
    try {
        newsLetterService
            .list(req.query)
            .then(newsLetter => {
                res.json({ totalCount: newsLetter.length, data: newsLetter });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single News Letter Listing
router.get("/:id", async (req, res) => {
    try {
        const newsLetter = await NewsLetter.findById(req.params.id);
        res.json(newsLetter);
    } catch (error) {
        res.json({ message: error });
    }
});

// //Delet News letter
// router.delete("/delete/:id", async (req, res)=> {
//     try{
//         const removeAttribute = await NewsLetter.findByIdAndDelete(req.params.id);        
//         res.json(removeAttribute);
//     } catch (error){
//         res.json({ message: error});
//     }
// });

module.exports = router;