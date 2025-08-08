const router = require("express").Router();
var mongodb = require('mongodb');
const { ObjectId } = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const Subarea = require('../../../model/Subarea');
const SubareaService = require('./subareaService');
const subareaService = new SubareaService();
const { parse } = require("csv-parse");
var moment = require('moment');
const passport = require('passport');
const uuidv1 = require('uuid');
const { picture, frontEnd, api } = require('config');
const SubareaRepository = require("./subareaRepository");
const subareaRepository = new SubareaRepository();
const State = require('../../../model/State');
const StateRepository = require('../state/stateRepository');
const stateRepository = new StateRepository();
const CityRepository = require('../city/cityRepository');
const cityRepository = new CityRepository();

const auth = passport.authenticate('jwt', { session: false });
// Add All State
router.post("/", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const name = req.body.name;

    const subareaobj = new Subarea({
        state_id: req.body.state,
        city_id: req.body.city,
        name: req.body.name,
        status: req.body.status,
        disable: false,
        created_by: userId,
    })
    try {
        const existingAreas = await Subarea.findOne({ name: name });
        if (existingAreas) {
            res.status(400).send({ message: `${existingAreas.name} Already exists` });
        } else {

            const savedSubarea = await subareaobj.save();
            res.send(savedSubarea);
        }

    } catch (error) {
        res.status(404).send(error);
    }
});
// Get All State Listing
router.get("/", async (req, res) => {
    try {
        subareaService
            .list(req.query)
            .then(subareas => {
                res.json({ data: subareas });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single State Listing
router.get("/:id", async (req, res) => {
    try {
        const subarea = await Subarea.findById(req.params.id);
        res.json(subarea);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update State
router.put("/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        let subareaObj = [];
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                subareaObj['disable'] = req.body[key];
                subareaObj['deleted_by'] = ObjectId(userId);
                subareaObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                subareaObj['status'] = req.body[key];
            } else if (key == "state") {
                subareaObj['state_id'] = req.body[key];
            } else if (key == "city") {
                subareaObj['city_id'] = ObjectId(req.body[key]);
            } else {
                subareaObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, subareaObj);
        const updatedSubarea = await Subarea.findByIdAndUpdate({ _id: req.params.id }, updateData);
        res.json(updatedSubarea);
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet State
router.delete("/delete/:id", async (req, res) => {
    try {
        const removeSubarea = await Subarea.findByIdAndDelete(req.params.id);
        res.json(removeSubarea);
    } catch (error) {
        res.json({ message: error });
    }
});


router.post("/uploadCSV", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);

        const csvFileData = req.body.csvFile;
        csvfilename = uuidv1() + ".csv";
        csvfilepicpath = picture.venueCSVFolder + csvfilename;
        csvPicFilename = __dirname + "/../../../" + csvfilepicpath;
        var base64Data;
        base64Data = req.body.csvFile;

        if (base64Data.indexOf("data:text/csv;") !== -1) {
            base64Data = base64Data.replace(/^data:text\/csv;base64,/, "");
        } else if (base64Data.indexOf("data:application/vnd.ms-excel;") !== -1) {
            base64Data = base64Data.replace(/^data:application\/vnd.ms-excel;base64,/, "");
        }

        if (typeof base64Data == 'undefined') {
            res.json({ message: "Only CSV file allowed!!" });
        } else if (base64Data != "") {
            await require("fs").writeFile(csvPicFilename, base64Data, 'base64', function (err) {
                if (err) console.log("FILE UPLOAD Error: ", err);
                let csvpath = csvPicFilename;// __dirname + "/../../public/uploads/venueCsv/98f98281-0c82-42b9-8b92-2207deaa8e41.csv";
                if (require('fs').existsSync(csvPicFilename)) {
                    const subAreaNames = []; // Array to store subarea names
                    // var subAreaName;
                    require('fs').createReadStream(csvPicFilename)
                        .pipe(parse({ delimiter: ",", from_line: 2 }))
                        .on("data", async (row) => {

                            var state;

                            if (row[0] !== "") {

                                state = row[0]
                            }
                            var city;
                            if (row[1] !== "") {
                                city = row[1]
                            }
                            var name;

                            if (row[2] !== "") {
                                name = row[2]
                            }


                            const { id } = await stateRepository.findByStateName(state);
                            const { _id } = await cityRepository.findByCityName(city);

                           const  subAreaName = await subareaRepository.findBySubareaName(name);

                           subAreaName.map(async (subarea)=>{
                            if (subarea.name === name) {
                                // throw new Error('Data Already exists');
                                //skipping already exists
                            }else{
                                
                            }
                           })
                          

                           const subareaObj = new Subarea({
                            state_id: id,
                            city_id: _id,
                            name: name,
                            disable: false,
                            status: true,
                            created_by: userId,

                        });
                        

                        await Subarea.insertMany(subareaObj)

                        })
                        .on('end', () => {
                            return res.json({ message: "Data Inserted Successfully"});

                        })


                } else {
                    return res.json({ message: "CSV file Not exist" });
                }
            });

        }
    }
    catch (e) {
        res.json({ message: error });
    }

});



module.exports = router;