const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const State = require('../../../model/State');
const { ObjectID } = require('mongodb');
var moment = require('moment');
const StateService = require("./stateService");
const stateService = new StateService;
// Add All State
router.post("/add", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const name = req.body.name;
    const stateobj = new State({
        country_id: 101,
        country_code: "IN",
        name: req.body.name,
        state_code:req.body.state_code,
        status: req.body.status,
        disable: false,
        created_by: userId,
    })
    try {
        const existingState = await State.findOne({name:name});
        if(existingState){
            res.status(400).send({message:`${existingState.name} Already exists`});
        }else{
           
            const savedState = await stateobj.save();
            res.send(savedState);
        }
       
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
});

// Get All State Listing
router.get("/", async (req, res) => {
    try {
        // let states=await State.aggregate([            
        //     {
        //       '$lookup': {
        //         'from': 'countries', 
        //         'localField': 'country_id', 
        //         'foreignField': '_id', 
        //         'as': 'countrydata'
        //       }
        //     }
        // ]);  
        stateService
        .list(req.query)
        .then(state => {
            res.json({totalCount:state.length, data: state});                
        })      
        
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});
// Get Single State Listing
router.get("/:id", async (req, res) => {
    try {
        const state = await State.findById(req.params.id);
        res.json(state);
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single State Listing By UrL
router.get("/getCountryStates/:country_id", async (req, res) => {
    var searchStateObj = { country_id: {$eq: ObjectID(req.params.country_id) }};
    try {
        const states = await State.find(searchStateObj);
        res.json(states);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update State
router.put("/update/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);        
        let stateObj = [];
        for(var key in req.body) {
            if(key == "disable" && req.body.disable == true) {
                stateObj['disable'] = req.body[key];       
                stateObj['deleted_by'] = ObjectID(userId);
                stateObj['deleted_at'] = moment.utc().toDate();
            } else if(key == "status") {
                stateObj['status'] = req.body[key];       
            } else if(key == "country_id") {
                stateObj['country_id'] = ObjectID(req.body[key]);       
            } else {
                stateObj[key] = req.body[key];       
            }
        }
        const updateData = Object.assign({}, stateObj);
        const updatedState = await State.findByIdAndUpdate({ _id: req.params.id }, updateData);
        res.json(updatedState);
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet State
router.delete("/delete/:id", async (req, res) => {
    try {
        const removeState = await State.findByIdAndDelete(req.params.id);
        res.json(removeState);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;