const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const Country = require('../../../model/Country');
const { ObjectID } = require('mongodb');
var moment = require('moment');
const CountryService = require("./countryService");
var countryService = new CountryService;
// Add All Country
router.post("/add", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const name = req.body.name;
    const countryobj = new Country({
        name: req.body.name,
        iso2: req.body.iso2,
        status: req.body.status,
        disable: false,
        created_by: userId,
    })
    try {
        const existingCountry = await Country.findOne({name:name});
    if(existingCountry){
        res.status(400).send({message:`${existingCountry.name} Already exists`});
    }else{
       
        const savedCountry = await countryobj.save();
        res.send(savedCountry);
    }
       
    } catch (error) {
        res.status(404).send(error);
    }
});

// Get All Country Listing
router.get("/", async (req, res) => {
    try {        
        countryService
        .list(req.query)
        .then(country => {
            res.json({totalCount:country.length, data: country});                
        })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single Country Listing
router.get("/:id", async (req, res) => {
    try {
        const country = await Country.findById(req.params.id);
        res.json(country);
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Country Listing By UrL
router.get("/getcountryName/:countryname", async (req, res) => {
    var myobj = { countryName: req.params.countryname };
    try {
        const Country = await Country.find(myobj);
        res.json(Country);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Country
router.put("/update/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);        
        let countryObj = [];
        for(var key in req.body) {
            if(key == "disable" && req.body.disable == true) {
                countryObj['disable'] = req.body[key];       
                countryObj['deleted_by'] = ObjectID(userId);
                countryObj['deleted_at'] = moment.utc().toDate();
            } else if(key == "status") {
                countryObj['status'] = req.body[key];       
            } else {
                countryObj[key] = req.body[key];       
            }
        }
        const updateData = Object.assign({}, countryObj);
        const updatedCountry = await Country.findByIdAndUpdate({ _id: req.params.id }, updateData);
        res.json(updatedCountry);
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet Country
router.delete("/delete/:id", async (req, res) => {
    try {
        const removeCountry = await Country.findByIdAndDelete(req.params.id);
        res.json(removeCountry);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;