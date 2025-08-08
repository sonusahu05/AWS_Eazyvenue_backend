const router = require("express").Router();
var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
const cipher = require('../common/auth/cipherHelper');
var express = require('express');
var mongoose = require('mongoose');
const Cmsmodule = require('../../../model/Cmsmodule');
const CmsmoduleService = require('./cmsmoduleService');
const uuidv1 = require('uuid');
const cmsmoduleService = new CmsmoduleService();
const { picture } = require('config');
const { ObjectId } = require('mongodb');
var moment = require('moment');
// Add All Cmsmodule
router.post("/", async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    let cmsImagefilename;
    if (typeof req.body.cmsImage != 'undefined' && req.body.cmsImage != "") {
        const cmsImageData = req.body.cmsImage;
        const fileType = cmsImageData.match(/[^:/]\w+(?=;|,)/)[0];
        cmsImagefilename = uuidv1() + "." + fileType;
        cmsImagepath = picture.cmsPicFolder + cmsImagefilename;
        let cmsFilename;
        cmsFilename = __dirname + "/../../../" + cmsImagepath;
        var base64Data;
        if (req.body.cmsImage.indexOf("data:image/png;") !== -1) {
            base64Data = req.body.cmsImage.replace(/^data:image\/png;base64,/, "");
        } else if (req.body.cmsImage.indexOf("data:image/jpg;") !== -1) {
            base64Data = req.body.cmsImage.replace(/^data:image\/jpg;base64,/, "");
        } else if (req.body.cmsImage.indexOf("data:image/jpeg") !== -1) {
            base64Data = req.body.cmsImage.replace(/^data:image\/jpeg;base64,/, "");
        }
        if (typeof base64Data == 'undefined') {
            res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
        } else if (base64Data != "") {
            require("fs").writeFile(cmsFilename, base64Data, 'base64', function (err) {
                console.log(err);
            });
        }
    }
    const cmsmoduleObj = new Cmsmodule({
        cmsTitle: req.body.cmsTitle,
        cmspageTitle: req.body.cmspageTitle,        
        slug: req.body.slug,
        cmsContent: req.body.cmsContent,
        cmsDescription: req.body.cmsDescription,
        cmsImage: cmsImagefilename,
        metaKeyword: req.body.metaKeyword,
        metaDescription: req.body.metaDescription,
        status: req.body.status,
        disable: false,
        created_by: userId,
        updated_by: ObjectId(userId)
    })
    try {
        // const savedCmsmodule = await cmsmodule.save();
        // res.send(savedCmsmodule);
        cmsmoduleService
            .addCmsModule(cmsmoduleObj)
            .then(async cmsmodule => {
                res.json({ message: "Data Inserted Successfully", id: cmsmodule.insertedId });
            })
            .catch(err => res.status(400).send({ error: err.message }));
    } catch (error) {
        res.status(404).send(error);
    }
});

// Get All Cmsmodule Listing
router.get("/", async (req, res) => {
    try {
        cmsmoduleService
            .list(req.query)
            .then(cms => {
                res.json({ totalCount: cms.length, data: cms });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single Cmsmodule Listing
router.get("/:id", async (req, res) => {
    try {
        const cmsmodule = await cmsmoduleService.findById(req.params.id);
        res.json(cmsmodule);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Cmsmodule
router.put("/:id", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const updateDataObj = [];
        updateDataObj['updated_by'] = ObjectId(userId);
        updateDataObj['updated_at'] = moment.utc().toDate();
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                updateDataObj['disable'] = req.body[key];
                updateDataObj['deleted_by'] = ObjectId(userId);
                updateDataObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                updateDataObj['status'] = req.body[key];
            } else if (key == 'cmsImage' && req.body.cmsImage != "") {
                const cmsImageData = req.body[key];
                const fileType = cmsImageData.match(/[^:/]\w+(?=;|,)/)[0];
                cmsImagefilename = uuidv1() + "." + fileType;
                cmsImagepath = picture.cmsPicFolder + cmsImagefilename;
                let cmsFilename;
                cmsFilename = __dirname + "/../../../" + cmsImagepath;
                var base64Data;
                if (req.body.cmsImage.indexOf("data:image/png;") !== -1) {
                    base64Data = req.body.cmsImage.replace(/^data:image\/png;base64,/, "");
                } else if (req.body.cmsImage.indexOf("data:image/jpg;") !== -1) {
                    base64Data = req.body.cmsImage.replace(/^data:image\/jpg;base64,/, "");
                } else if (req.body.cmsImage.indexOf("data:image/jpeg") !== -1) {
                    base64Data = req.body.cmsImage.replace(/^data:image\/jpeg;base64,/, "");
                }
                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {
                    require("fs").writeFile(cmsFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    updateDataObj['cmsImage'] = cmsImagefilename;
                }
            } else {
                updateDataObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, updateDataObj);
        cmsmoduleService.update(req.params.id, updateData).then(updatedUser => {
            res.json({ message: "Data Updated Successfully", data: updatedUser });
        });
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet Cmsmodule
router.delete("/:id", async (req, res) => {
    try {
        const removeCmsmodule = await Cmsmodule.findByIdAndDelete(req.params.id);
        res.json(removeCmsmodule);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;