const router = require("express").Router();
const BannerService = require('./bannerService');

// var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
var express = require('express');
var mongoose = require('mongoose');
const cipher = require('../common/auth/cipherHelper');
const { picture } = require('config');
const { frontEnd } = require('config');
const { api } = require('config');
const uuidv2 = require('uuid');
const Banner = require('../../../model/banner');
const bannerService = new BannerService();



const { ObjectID } = require('mongodb');
var moment = require('moment'); const { Console } = require("console");

// Add All Banner
router.post("/", async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        let bannerImagefilename = [];

        if (typeof req.body.banner_images != 'undefined' && req.body.banner_images != "") {
            // var bannerImageObj = {
            //     "banner_image_src": '',
            //     "alt": '',
            //     'default': ''
            // }
            req.body.banner_images.forEach(element => {
                const bannerImageData = element.file;

                const fileType = bannerImageData.match(/[^:/]\w+(?=;|,)/)[0];
                bannerFile = uuidv2() + "." + fileType;
                bannerImagefilename.push({ banner_image_src: bannerFile, alt: element.alt, default: element.default });
                bannerpath = picture.bannerImageFolder + bannerFile;
                let bannerfilename;
                bannerfilename = __dirname + "/../../../" + bannerpath;
                //console.log(bannerfilename); return;

                var base64Data;
                if (bannerImageData.indexOf("data:image/png;") !== -1) {
                    base64Data = bannerImageData.replace(/^data:image\/png;base64,/, "");
                } else if (bannerImageData.indexOf("data:image/jpg;") !== -1) {
                    base64Data = bannerImageData.replace(/^data:image\/jpg;base64,/, "");
                } else if (bannerImageData.indexOf("data:image/jpeg") !== -1) {
                    base64Data = bannerImageData.replace(/^data:image\/jpeg;base64,/, "");
                }
                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {

                    require("fs").writeFile(bannerfilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                }

            });
        }

        const banner = new Banner({
            banner_title: req.body.banner_title,
            banner_image: bannerImagefilename,
            slug: req.body.slug,
            // banner_url: req.body.banner_url,
            // banner_content: req.body.banner_content,
            status: req.body.status,
            disable: req.body.disable,
            created_by: userId,
            updated_by: ObjectID(userId)
        });

        bannerService
            .addBanner(banner)
            .then(banner => {
                res.json({ message: "Data Inserted Successfully", id: banner.insertedId });
            })
            .catch(err => {
                res.status(400).json({ message: err.message, status: 400 });
            });

    } catch (error) {
        res.status(400).json({ message: error, status: 400 });
    }
});


// Get All Banner Listing
router.get("/", async (req, res) => {
    try {
        bannerService
            .list(req.query)
            .then(banner => {
                res.json({ totalCount: banner.length, data: banner });
            })
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Banner Listing
router.get("/:id", async (req, res) => {
    try {
        const bannerData = await bannerService.findById(req.params.id);
        res.json(bannerData);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Banner
router.put("/:id", async (req, res) => {
    try {

        const userId = cipher.getUserFromToken(req);
        let updatedFilename = [];

        const bannerObj = [];
        bannerObj['updated_by'] = ObjectID(userId);
        bannerObj['updated_at'] = moment.utc().toDate();
        let oldImagesArr = [];
        let newImageUpdatedArr = [];
        let imageDetails;
        let bannerDetails = await bannerService.findById(req.params.id);
        let bannerImagesDetails = bannerDetails.banner_image;
        let image;
        let newImagesArr = [];
        let deletedImages = [];
        bannerImagesDetails.forEach(element => {
            image = element.banner_image_src;
            imageDetails = image.replace(frontEnd.picPath  + '/' + picture.showBannerPicFolderPath, '');
            oldImagesArr.push({ banner_image_src: imageDetails, alt: element.alt, default: element.default });

        });
        for (var key in req.body) {
            if (key == 'banner_images' && req.body.banner_images != "") {
                req.body.banner_images.forEach(element => {
                    const bannerData = element.file;
                    const fileType = bannerData.match(/[^:/]\w+(?=;|,)/)[0];
                    updatedBannerFile = uuidv2() + "." + fileType;
                    //updatedFilename.push(bannerImageObj = {banner_image_src:updatedBannerFile});
                    bannerPath = picture.bannerImageFolder + updatedBannerFile;
                    let bannerImageFilename = "";
                    bannerImageFilename = __dirname + "/../../../" + bannerPath;

                    var base64Data;
                    if (bannerData.indexOf("data:image/png;") !== -1) {
                        base64Data = bannerData.replace(/^data:image\/png;base64,/, "");
                    } else if (bannerData.indexOf("data:image/jpg;") !== -1) {
                        base64Data = bannerData.replace(/^data:image\/jpg;base64,/, "");
                    } else if (bannerData.indexOf("data:image/jpeg") !== -1) {
                        base64Data = bannerData.replace(/^data:image\/jpeg;base64,/, "");
                    }

                    if (typeof base64Data == 'undefined') {
                        res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                    } else if (base64Data != "") {
                        let isFounded = oldImagesArr.includes(bannerImageFilename);
                        if (isFounded === false) {
                            require("fs").writeFile(bannerImageFilename, base64Data, 'base64', function (err) {
                                console.log(err);
                            });
                            newImagesArr.push({ banner_image_src: updatedBannerFile, alt: element.alt, default: element.default });
                        }
                    }
                });
            } else if (key == 'deleted_images' && req.body.deleted_images != "") {
                req.body.deleted_images.forEach(element => {
                    deletedImages.push({ banner_image_src: element.replace(frontEnd.picPath  + '/' + picture.showBannerPicFolderPath, '') });
                });
            } else if (key == "disable" && req.body.disable == true) {
                bannerObj['disable'] = req.body[key];
                bannerObj['deleted_by'] = ObjectID(userId);
                bannerObj['deleted_at'] = moment.utc().toDate();
            } else {
                bannerObj[key] = req.body[key];
            }
        }

        const bannerImagesDetailsArr = oldImagesArr.concat(newImagesArr);

        deletedImages.forEach(item => {
            let removeIndex = findIndexByName(item.banner_image_src, bannerImagesDetailsArr);
            if (removeIndex != -1) {
                bannerImagesDetailsArr.splice(removeIndex, 1);
            }
        });
        // bannerImagesDetailsArr.forEach(element => {
        //     let isDeletedImageFounded = deletedImages.includes(element.banner_image_src);


        //     if (isDeletedImageFounded === false) {
        //         newImageUpdatedArr.push({ banner_image_src: element.banner_image_src, alt: element.alt, default: element.default });
        //     }

        // });

        bannerObj['banner_image'] = bannerImagesDetailsArr;
        const updateData = Object.assign({}, bannerObj);
        const updatedBanner = await bannerService.updateBanner(req.params.id, updateData);
        res.json({ message: "Data Updated Successfully", data: updatedBanner });

    } catch (error) {
        res.json({ message: error });
    }
});

function findIndexByName(name, arrayName) {
    let index = -1;
    for (let i = 0; i < arrayName.length; i++) {
        if (arrayName[i].banner_image_src === name) {
            index = i;
            break;
        }
    }
    return index;
}
//Delet Banner
router.delete("/:id", async (req, res) => {
    try {
        const removeBanner = await Banner.findByIdAndDelete(req.params.id);
        res.json(removeBanner);
    } catch (error) {
        res.json({ message: error });
    }
});

module.exports = router;