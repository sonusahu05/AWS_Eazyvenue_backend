const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const City = require('../../../model/City');
const CityService = require('./cityService');
const { ObjectID } = require('mongodb');
const cityService = new CityService();
var moment = require('moment');
// Add All State
router.post("/add", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const name =  req.body.name;
    const cityobj = new City({
        country_id: req.body.country_id,
        state_id: req.body.state['id'],
        name: req.body.name,
        status: req.body.status,
        disable: false,
        created_by: userId,
    })
    try {
        const existingCities = await City.findOne({name:name});
        if(existingCities){
            res.status(400).send({message:`${existingCities.name} Already exists`});
        }else{
           
            const savedCity = await cityobj.save();
            res.send(savedCity);
        }       
     
    } catch (error) {
        res.status(404).send(error);
    }
});

// Get All State Listing
router.get("/", async (req, res) => {
    try {
        if (req.query.list && req.query.list === "true") {
            console.log(req.query);
            const pipeline = [
                {
                    $match: {
                        disable: false,
                        status: true
                    }
                },
                {
                    $project: {
                        cities: "$$ROOT",
                    },
                },
                {
                    $lookup: {
                        localField: "cities.state_id",
                        from: "states",
                        foreignField: "id",
                        as: "states",
                    },
                },
                {
                    $unwind: {
                        path: "$states",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $lookup: {
                        localField: "cities.country_id",
                        from: "countries",
                        foreignField: "id",
                        as: "countries",
                    },
                },
                {
                    $unwind: {
                        path: "$countries",
                        preserveNullAndEmptyArrays: false,
                    },
                },
                {
                    $project: {
                        "id": "$cities._id",
                        "cityname": "$cities.name",
                        "countryname": "$countries.name",
                        "countrycode": "$cities.country_code",
                        "statename": "$states.name",
                        "statecode": "$cities.state_code",
                        "status": "$cities.status",
                        "disable": "$cities.disable",
                        "created_at": "$cities.created_at",
                        "updated_at": "$cities.updated_at",
                        _id: 0
                    },
                }
            ];
    
            const cities = await City.aggregate(pipeline);
    
            const cityList = cities.map(e => ({
                id: e.id,
                name: e.cityname + ', ' + e.statename + ', ' + e.countryname,
                countryname: e.countryname,
                countrycode: e.countrycode,
                statename: e.statename,
                statecode: e.statecode,
                status: e.status,
                disable: e.disable,
                created_at: e.created_at,
                updated_at: e.updated_at,
            }))
    
            res.status(200).json({ data: {
                totalCount: cityList.length,
                items: cityList
            } });
        }else{
            cityService
                .list(req.query)
                .then(cities => {
                    res.json({data: cities});                
            })
        }
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});
// Get Single State Listing
router.get("/:id", async (req, res) => {
    try {
        const city = await City.findById(req.params.id);
        res.json(city);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update State
router.put("/update/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);        
        let cityObj = [];
        for(var key in req.body) {
            if(key == "disable" && req.body.disable == true) {
                cityObj['disable'] = req.body[key];       
                cityObj['deleted_by'] = ObjectID(userId);
                cityObj['deleted_at'] = moment.utc().toDate();
            } else if(key == "status") {
                cityObj['status'] = req.body[key];       
            } else if(key == "country_id") {
                cityObj['country_id'] = ObjectID(req.body[key]);       
            } else  if(key == "state_id") {
                cityObj['state_id'] = ObjectID(req.body[key]);       
            } else {
                cityObj[key] = req.body[key];       
            }
        }
        const updateData = Object.assign({}, cityObj);
        const updatedCity = await City.findByIdAndUpdate({ _id: req.params.id }, updateData);
        res.json(updatedCity);
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});

//Delet State
router.delete("/delete/:id", async (req, res) => {
    try {
        const removeCity = await City.findByIdAndDelete(req.params.id);
        res.json(removeCity);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;