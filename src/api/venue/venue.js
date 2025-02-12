const router = require("express").Router();
const Venue = require("../../../model/Venue");
const User = require("../../../model/User");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const uuidv1 = require('uuid');
const UserService = require('../user/userService');
const userService = new UserService();
const CategoryService = require('../category/categoryService');
const categoryService = new CategoryService();

const SubareaService = require('../subarea/subareaService');
const subareaService = new SubareaService();
const VenueService = require('./venueService');
const venueService = new VenueService();
const { ObjectId } = require('mongodb');
const { picture, frontEnd, api } = require('config');
const fs = require("fs");
const { parse } = require("csv-parse");
var moment = require('moment');
const PostavailabilityService = require('../postavailability/postavailabilityService');
const postavailabilityService = new PostavailabilityService();
const mongoose = require('mongoose');
const Category = require("../../../model/Category");

function uploadVenueImage(venueImage) {
    var decorImagefilename = [];
    venueImage.forEach(element => {
        const venueImageData = element.file;
        const fileType = venueImageData.match(/[^:/]\w+(?=;|,)/)[0];
        decorFile = uuidv1() + "." + fileType;
        decorImagefilename.push({ venue_image_src: decorFile, alt: element.alt, default: element.default });
        venuePath = picture.decorPicFolder + decorFile;
        let venuefilename;
        venuefilename = __dirname + "/../../../" + venuePath;

        var base64Data;
        if (venueImageData.indexOf("data:image/png;") !== -1) {
            base64Data = venueImageData.replace(/^data:image\/png;base64,/, "");
        } else if (venueImageData.indexOf("data:image/jpg;") !== -1) {
            base64Data = venueImageData.replace(/^data:image\/jpg;base64,/, "");
        } else if (venueImageData.indexOf("data:image/jpeg") !== -1) {
            base64Data = venueImageData.replace(/^data:image\/jpeg;base64,/, "");
        }

        if (typeof base64Data == 'undefined') {
            res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
        } else if (base64Data != "") {

            require("fs").writeFile(venuefilename, base64Data, 'base64', function (err) {
                console.log(err);
            });
        }
    });
    return decorImagefilename;
}
router.post('/', auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        var decor1Imagefilename;
        var decor2Imagefilename;
        var decor3Imagefilename;
        var venueImagefilename = [];
        const { salt, passwordHash } = cipher.saltHashPassword(req.body.password);
        // let profilepicfilename;
        // if (typeof req.body.profilepic != 'undefined' && req.body.profilepic != "") {
        //     const profilepicData = req.body.profilepic;
        //     const fileType = profilepicData.match(/[^:/]\w+(?=;|,)/)[0];
        //     profilepicfilename = uuidv1() + "." + fileType;
        //     profilepicpath = picture.profilePicFolder + profilepicfilename;
        //     let profileFilename;
        //     profileFilename = __dirname + "/../../../" + profilepicpath;

        //     var base64Data;
        //     if (req.body.profilepic.indexOf("data:image/png;") !== -1) {
        //         base64Data = req.body.profilepic.replace(/^data:image\/png;base64,/, "");
        //     } else if (req.body.profilepic.indexOf("data:image/jpg;") !== -1) {
        //         base64Data = req.body.profilepic.replace(/^data:image\/jpg;base64,/, "");
        //     } else if (req.body.profilepic.indexOf("data:image/jpeg") !== -1) {
        //         base64Data = req.body.profilepic.replace(/^data:image\/jpeg;base64,/, "");
        //     }

        //     if (typeof base64Data == 'undefined') {
        //         res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
        //     } else if (base64Data != "") {
        //         require("fs").writeFile(profileFilename, base64Data, 'base64', function (err) {
        //             console.log(err);
        //         });
        //     }
        // }
        var portfoliofilename;
        if (typeof req.body.portfolioImage != 'undefined' && req.body.portfolioImage != "") {
            portfoliofilename = uploadPortfolioImage(req.body.portfolioImage);
        }

        var zipcode = req.body.zipcode;
        var ownermobileNumber = req.body.ownermobileNumber;

        categoryId = null;
        var userObj;
        userObj = new User({
            firstName: req.body.ownerfirstName,
            lastName: req.body.ownerlastName,
            email: req.body.owneremailId,
            fullName: req.body.ownerfirstName + " " + req.body.ownerlastName,
            role: req.body.role,
            //organizationId: ObjectId(req.body.organizationId),
            //age: req.body.age,
            status: true,
            disable: req.body.disable,
            address: req.body.address.replace(/[\r\n]/gm, ' '),
            salt: salt,
            passwordHash: passwordHash,
            gender: req.body.ownergender,
            category: categoryId,
            mobileNumber: ownermobileNumber.toString(),
            zipcode: zipcode.toString(),
            //profilepic: profilepicfilename,
            countrycode: req.body.countrycode,
            countryname: req.body.countryname,
            statecode: req.body.statecode,
            statename: req.body.statename,
            citycode: req.body.citycode,
            cityname: req.body.cityname,
            timeZone: req.body.timeZone,
            timeZoneOffset: req.body.timeZoneOffset,
            created_by: userId,
            updated_by: ObjectId(userId),
        });
        userService
            .addUser(userObj)
            .then(user => {
                if (typeof req.body.venueImage != 'undefined' && req.body.venueImage != "") {
                    req.body.venueImage.forEach(element => {
                        const venueImageData = element.file;
                        const fileType = venueImageData.match(/[^:/]\w+(?=;|,)/)[0];
                        venueFile = uuidv1() + "." + fileType;
                        venueImagefilename.push({ venue_image_src: venueFile, alt: element.alt, default: element.default });
                        venuePath = picture.venuePicFolder + venueFile;
                        let venuefilename;
                        venuefilename = __dirname + "/../../../" + venuePath;

                        var base64Data;
                        if (venueImageData.indexOf("data:image/png;") !== -1) {
                            base64Data = venueImageData.replace(/^data:image\/png;base64,/, "");
                        } else if (venueImageData.indexOf("data:image/jpg;") !== -1) {
                            base64Data = venueImageData.replace(/^data:image\/jpg;base64,/, "");
                        } else if (venueImageData.indexOf("data:image/jpeg") !== -1) {
                            base64Data = venueImageData.replace(/^data:image\/jpeg;base64,/, "");
                        }

                        if (typeof base64Data == 'undefined') {
                            res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                        } else if (base64Data != "") {

                            require("fs").writeFile(venuefilename, base64Data, 'base64', function (err) {
                                console.log(err);
                            });
                        }
                    });
                }
                if (typeof req.body.decor1Image != 'undefined' && req.body.decor1Image != "") {
                    decor1Imagefilename = uploadVenueImage(req.body.decor1Image);
                }
                if (typeof req.body.decor2Image != 'undefined' && req.body.decor2Image != "") {
                    decor2Imagefilename = uploadVenueImage(req.body.decor2Image);
                }
                if (typeof req.body.decor3Image != 'undefined' && req.body.decor3Image != "") {
                    decor3Imagefilename = uploadVenueImage(req.body.decor3Image);
                }
                var videoFilename = "";
                if (typeof req.body.venueVideo != 'undefined' && req.body.venueVideo != "") {
                    videoFilename = uuidv1() + ".mp4";
                    videoFilepath = picture.venueVideoFolder + videoFilename;
                    videoFilePathname = __dirname + "/../../../" + videoFilepath;
                    var base64Data;
                    base64Data = req.body.venueVideo;
                    if (base64Data.indexOf("data:video/mp4;") !== -1) {
                        base64Data = base64Data.replace(/^data:video\/mp4;base64,/, "");
                    }
                    if (typeof base64Data == 'undefined') {
                        res.json({ message: "Only Video file allowed!!" });
                    } else if (base64Data != "") {
                        require("fs").writeFile(videoFilePathname, base64Data, 'base64', function (err) {
                            if (err != null) {
                                console.log("FILE UPLOAD Error: ", err);
                            }
                        });
                    }
                }
                const venueObj = new Venue({
                    name: req.body.name,
                    //categoryId: ObjectId(req.body.categoryId),            
                    mobileNumber: req.body.mobileNumber.toString(),
                    email: req.body.email,
                    category: req.body.category,
                    foodType: req.body.foodType,
                    propertyType: req.body.propertyType,
                    address: req.body.address,
                    foodMenuType: req.body.foodMenuType,
                    zipcode: req.body.zipcode.toString(),
                    area: req.body.area,
                    capacity: req.body.capacity,
                    theaterSitting: req.body.theaterSitting,
                    acdetails: req.body.acdetails,
                    parkingdetails: req.body.parkingdetails,
                    kitchendetails: req.body.kitchendetails,
                    capacityDescription: req.body.capacityDescription,
                    decorationdetails: req.body.decorationdetails,
                    amenities: req.body.amenities,
                    roundTable: req.body.roundTable,
                    countrycode: req.body.countrycode,
                    statecode: req.body.statecode,
                    statename: req.body.statename,
                    citycode: req.body.citycode,
                    cityname: req.body.cityname,
                    subareaid: req.body.subareaid,
                    description: req.body.description,
                    shortdescription: req.body.shortdescription,
                    assured: req.body.assured,
                    venueImage: venueImagefilename,
                    decor1Image: decor1Imagefilename,
                    decor2Image: decor2Imagefilename,
                    decor3Image: decor3Imagefilename,
                    venuePrice: req.body.venuePrice,
                    minPrice: req.body.minPrice,
                    maxPrice: req.body.maxPrice,
                    decor1Price: req.body.decor1Price,
                    decor2Price: req.body.decor2Price,
                    decor3Price: req.body.decor3Price,
                    venueVideo: videoFilename,
                    googleRating: req.body.googleRating,
                    eazyVenueRating: req.body.eazyVenueRating,
                    slot: req.body.slot,
                    couponCode: req.body.couponCode,
                    bookingPrice: req.body.bookingPrice,
                    isSwimmingPool: req.body.isSwimmingPool,
                    isParking: req.body.isParking,
                    isAC: req.body.isAC,
                    isGreenRooms: req.body.isGreenRooms,
                    isPowerBackup: req.body.isPowerBackup,
                    isDJ: req.body.isDJ,
                    isPrivateParties: req.body.isPrivateParties,
                    isWaiterService: req.body.isWaiterService,
                    isVIPSection: req.body.isVIPSection,
                    isRooms: req.body.isRooms,
                    isPillarFree: req.body.isPillarFree,
                    isEntertainmentLicense: req.body.isEntertainmentLicense,
                    cancellationDescription: req.body.cancellationDescription,
                    ownerId: user.insertedId,
                    created_by: userId,
                    minRevenue: req.body.minRevenue,
                    peopleBooked: req.body.peopleBooked,
                });
                //console.log(venueObj);
                venueService
                    .addvenue(venueObj)
                    .then(async venue => {
                        res.json({ message: "Data Inserted Successfully", id: venue.insertedId });
                    })
                    .catch(err => res.status(400).send({ error: err.message }));
                // res.json({ message: "Data Inserted Successfully", id: user.insertedId });
            }).catch(err => res.status(400).send({ error: err.message }));

    } catch (error) {
        res.json({ message: error });
    }
});

router.get('/venuesByFilter',async (req,res) =>{
    try{
        const categoryId = req.query.categoryId;
        const citycodes = req.query.citycode;
        const subareaIds = req.query.subareaid;
        const guestCount = req.query.guestCount;
        const startSearchDate = req.query.startSearchDate;
        const endSearchDate = req.query.endSearchDate; 
        const minVenuePrice = req.query.minVenuePrice;
        const maxVenuePrice = req.query.maxVenuePrice;
        const propertyTypes = req.query.propertyType;
        const slotId = req.query.slotId; //add filter by slot logic
        const seatingCapacity = req.query.seatingCapacity; //theater capacity
        const floatingCapacity = req.query.floatingCapacity; //floating capacity
        const foodType = req.query.foodType;
        const amanities = req.query.amanities;
        const assured = req.query.assured;
        const disabled = req.query.disabled;
        const venueIds = req.query.venueIds;//filter by venueIds

        //admin extra filters
        const admin = req.query.admin;
        const venueName = req.query.name;
        const email = req.query.email;
        const countryName = req.query.countryName;
        const statename = req.query.statename;
        const cityname = req.query.cityname;
        const zipcode = req.query.zipcode;
        

        const page = parseInt(req.query.pageNumber, 10) || 1;
        const limit = parseInt(req.query.pageSize, 10) || 10;
        const skip = (page - 1) * limit;

        let query = req.query.categoryId === undefined && req.query.categoryId != '' ? {} : {'category.id':req.query.categoryId}
        let postQuery = {}
        if(Array.isArray(req.query.citycode) && req.query.citycode.length > 0){
            query['citycode'] = {$in: req.query.citycode};
        }else if(typeof req.query.citycode === 'string'){
            query['citycode'] = req.query.citycode;
        }

        if(Array.isArray(req.query.venueIds) && req.query.venueIds.length > 0){
            const venues = req.query.venueIds.map(id => mongoose.Types.ObjectId(id));
            query['_id'] = {$in: venues};
        }else if(typeof req.query.venueIds === 'string'){
            query['_id'] = mongoose.Types.ObjectId(req.query.venueIds);
        }

        if (Array.isArray(req.query.subareaid) && req.query.subareaid.length > 0) {
            const subareaObjectIds = req.query.subareaid.map(id => mongoose.Types.ObjectId(id));
            query['subareaid'] = { $in: subareaObjectIds };
        } else if (typeof req.query.subareaid === 'string') {
            query['subareaid'] = mongoose.Types.ObjectId(req.query.subareaid);
        }
        query['capacity'] = { $gt: parseInt(req.query.guestCount, 10) || 0 };

        if (req.query.seatingCapacity !== undefined && req.query.seatingCapacity !== '') {
          query['theaterSitting'] = { $lt: parseInt(req.query.seatingCapacity, 10) || 0 };
        }

        if(Array.isArray(req.query.foodType) && req.query.foodType.length > 0){
            query['foodType.id'] = {$in: req.query.foodType};
        }else if(typeof req.query.foodType === 'string'){
            query['foodType.id'] = req.query.foodType;
        }
        if(Array.isArray(req.query.amanities) && req.query.amanities.length > 0){
            query['amenities'] = {
                $all: req.query.amanities.map(value => new RegExp(value, 'i'))
            };
        }else if(typeof req.query.amanities === 'string'){
            query['amenities'] = { $regex: new RegExp(req.query.amanities, 'i') };
        }
        
        // if (req.query.floatingCapacity !== undefined && req.query.floatingCapacity !== '') {
        //   query['floatingCapacity'] = { $lt: parseInt(req.query.floatingCapacity, 10) || 0 };
        // }
        if(!admin){
            query['assured'] = req.query.assured === 'true';
            query['disable'] = req.query.disabled === 'true';
        }else{
            if (req.query.assured !== undefined && req.query.assured !== '') {
                query['assured'] = { $eq: req.query.assured === 'true' };
              }
              if (req.query.disable !== undefined && req.query.disable !== '') {
                query['disable'] = { $eq: req.query.disable === 'false' };
              }
        }

        if (req.query.name !== undefined && req.query.name !== '') {
          query['name'] = { $regex: new RegExp(req.query.name, 'i') };
        }
        if (req.query.email !== undefined && req.query.email !== '') {
            query['email'] = { $regex: new RegExp(req.query.email, 'i') };
          }
          if (req.query.statename !== undefined && req.query.statename !== '') {
            query['statename'] = { $regex: new RegExp(req.query.statename, 'i') };
          }
          if (req.query.cityname !== undefined && req.query.cityname !== '') {
            query['cityname'] = { $regex: new RegExp(req.query.cityname, 'i') };
          }
          if (req.query.zipcode !== undefined && req.query.zipcode !== '') {
            query['zipcode'] = { $regex: new RegExp(req.query.zipcode, 'i') };
          }


        if(Array.isArray(req.query.propertyType) && req.query.propertyType.length > 0){
            query['propertyType.id'] = {$in: req.query.propertyType};
        }else if(typeof req.query.propertyType === 'string'){
            query['propertyType.id'] = req.query.propertyType;
        }
        // console.log(query);
        let pipeLine = [
            {
                $match:query
            },
            {
                $lookup:{
                    from:"subareaes",
                    localField:"subareaid",
                    foreignField:"_id",
                    as: 'subarea'
                },
            },
            {
                $unwind: '$subarea'
            },
        ]

        if (req.query.startSearchDate !== undefined && req.query.endSearchDate) {
            const startDate = new Date(req.query.startSearchDate + " 24:00:00");
            const endDate = new Date(req.query.endSearchDate + " 24:00:00");
            
            postQuery['date'] = {
                $gt: startDate,
                $lt: endDate
            };
        
            pipeLine.push({
                $lookup: {
                    from: "postavailabilities",
                    localField: "_id",
                    foreignField: "venueId",
                    as: 'slotsavailable',
                }
            },
            {
                $match: {
                    'slotsavailable.slotdate': postQuery.date
                }
            },
            {
                $project: {
                    slotsavailable: 0
                }
            });
        }
        
        pipeLine.push(
            {
                $addFields: {
                    calculatedValue: {
                        $multiply: [
                            {
                                $toInt:
                                {
                                    $arrayElemAt: [
                                        "$foodMenuType.veg_food.value",
                                        0]
                                }
                            },
                            parseInt(req.query.guestCount,10) || 0
                        ]
                    }
                }
            },
        )
        //guest count is mandatory for budget filtering
        // if(req.query.minBudget && req.query.maxBudget){
        //     pipeLine.push(
        //         {
        //             $match: {
        //                 calculatedValue: {
        //                     $gte: parseInt(req.query.minBudget, 10) || 0,
        //                     $lte: parseInt(req.query.maxBudget, 10) || Number.MAX_SAFE_INTEGER
        //                 }
        //             }
        //         } 
        //     )
        // }
        pipeLine.push({
                $sort: {
                    created_at: -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        )
        console.log(JSON.stringify(pipeLine));
        Venue.aggregate(pipeLine).exec((err,result) =>{
            if(err){
                res.status(500).json({message: err.message})
            }else{ 
                let data = [];
                for(let d of result){
                    let item = d;
                    const subarea = d.subarea.name;
                    delete item.subarea;
                    item['subarea'] = subarea;
                    const amenities = item.amenities.split(',');
                    delete item.amenities;


                    item.venueImage = item.venueImage.map(obj => ({
                        ...obj,
                        venue_image_src: frontEnd.picPath + "/" + picture.showVenuePicFolderPath + obj.venue_image_src
                    }));
                    item['amenities'] = amenities.map(value => ({ title: value.trim() }));
                    if(req.query.minVenuePrice && req.query.maxVenuePrice){
                        if(d.calculatedValue >=  parseInt(req.query.minVenuePrice,10) || 0 && d.calculatedValue <= parseInt(req.query.maxVenuePrice,10) || 0){
                            data.push(item)    
                        }
                    }else{
                        data.push(item)
                    }
                }
                const modifiedVenueList =  data.map(v => {
                    if (v instanceof mongoose.Document) {
                        v = v.toObject();
                    }
                    v.id = v._id.toString(); 
                    delete v._id;
                    return v;
                });
                res.status(200).json({data:{totalCount: result.length,items: modifiedVenueList}})
            }
        })

        // Venue.find(query)
        // .skip(skip)
        // .limit(limit) 
        // .exec((err, result) =>{
        //     if(err){
        //         res.status(500).json({message: err.message})
        //     }else{
        //         res.status(200).json({data:{totalCount: result.length,items: result}})
        //     }
        // })
        
        // res.status(200).json({data:"data"});

    }catch(err){
        res.status(500).json({message: err.message})
    }
})
router.get("/minMaxVenuePrice",async (req,res) =>{
    try{
        const guestCount = parseInt(req.query.guestCount);
        const categoryId = req.query.categoryId;
        const citycodes = req.query.citycode;
        const subareaIds = req.query.subareaid;

        let query = req.query.categoryId === undefined && req.query.categoryId != '' ? {} : {'category.id':req.query.categoryId}
        
        if(Array.isArray(req.query.citycode) && req.query.citycode.length > 0){
            query['citycode'] = {$in: req.query.citycode};
        }else if(typeof req.query.citycode === 'string'){
            query['citycode'] = req.query.citycode;
        }

        if(Array.isArray(req.query.venueIds) && req.query.venueIds.length > 0){
            const venues = req.query.venueIds.map(id => mongoose.Types.ObjectId(id));
            query['_id'] = {$in: venues};
        }else if(typeof req.query.venueIds === 'string'){
            query['_id'] = mongoose.Types.ObjectId(req.query.venueIds);
        }

        if (Array.isArray(req.query.subareaid) && req.query.subareaid.length > 0) {
            const subareaObjectIds = req.query.subareaid.map(id => mongoose.Types.ObjectId(id));
            query['subareaid'] = { $in: subareaObjectIds };
        } else if (typeof req.query.subareaid === 'string') {
            query['subareaid'] = mongoose.Types.ObjectId(req.query.subareaid);
        }
        
        const pipeline = [{
            $match:query
        },
        {
            $lookup:{
                from:"subareaes",
                localField:"subareaid",
                foreignField:"_id",
                as: 'subarea'
            },
        },
        {
            $unwind: '$subarea'
        },];
        if(!guestCount){
            res.status(500).json({data: "no guest count"})
        }else{
            pipeline.push({
                $addFields: {
                    calculatedValue: {
                        $multiply: [
                            { $toInt: { $arrayElemAt: ["$foodMenuType.veg_food.value", 0] } },
                            parseInt(guestCount, 10) || 0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    minCalculatedValue: { $min: "$calculatedValue" },
                    maxCalculatedValue: { $max: "$calculatedValue" }
                }
            }, {
                $project: {
                    _id: 0,
                    minCalculatedValue: 1,
                    maxCalculatedValue: 1
                }
            })
        }
        const result = await Venue.aggregate(pipeline);
        res.status(200).json({data: result})
    }catch(e){
        res.status(500).json({message: e.message})
    }
})
router.get('/amanetiesList',async(req,res)=>{
    try{
       const pipeLine = [
            {
              $unwind: {
                path: "$amenities",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                amenitiesArray: { $split: ["$amenities", ", "] }
              }
            },
            {
              $unwind: "$amenitiesArray"
            },
            {
              $group: {
                _id: null,
                distinctAmenities: { $addToSet: "$amenitiesArray" }
              }
            },
            {
              $project: {
                _id: 0,
                distinctAmenities: 1
              }
            }
          ];
          Venue.aggregate(pipeLine).exec((err,result) =>{
            if(err){
                res.status(500).json({message:err.message})
            }
            console.log(result);
            const amanetiesList = result[0].distinctAmenities.map(o =>{
                const a = {
                    key: o,
                    name: o
                }
                return a;
            })
            res.status(200).json({data: amanetiesList})
          })

    }catch(err){
        res.status(500).json({message:err.message})
    }
})

router.get('/occasionCategoryList',async (req,res) =>{
    try{
        const occasionItem = await Category.findOne({slug:"parent_category"});
        //get Parent = parent_category.id
        const occationCategories = await Category.find({parent: occasionItem._id});
        occationCategories.forEach(element => {
            element.id = element._id;
            element.categoryImage = frontEnd.picPath  + "/" + picture.showCategoryPicFolderPath + element.categoryImage;
        });

        const modifiedCategories = occationCategories.map(category => {
            const modifiedCategory = category.toObject(); // Convert to plain JavaScript object
            modifiedCategory.id = modifiedCategory._id.toString(); // Add id property
            delete modifiedCategory._id; // Remove the original _id property
            return modifiedCategory;
        });

        res.status(200).json({data:modifiedCategories})    
    }catch(err){
        res.status(500).json({message:err.message})
    }
})

router.get("/homeMenuList", async(req,res) =>{
    try{
        //get slug = Vendor category
        const vendorCategoryItem = await Category.findOne({name:"Vendor"});
        console.log(vendorCategoryItem);
        //get Parent= = Vondor Category.id
        const vendorCategories = await Category.find({parent: vendorCategoryItem._id})
        let vendorList = [];
        const photo = vendorCategories.find(o => o.name === "Photographer");
        const decor = vendorCategories.find(o => o.name === "Decorater");
        vendorList.push(photo)
        vendorList.push(decor)

        vendorList.forEach(element =>{
            element.id = element._id;
        })

        const modifiedVendorList = vendorList.map(vendor =>{
            const modifiedCategory = vendor.toObject(); // Convert to plain JavaScript object
            modifiedCategory.id = modifiedCategory._id.toString(); // Add id property
            delete modifiedCategory._id; // Remove the original _id property
            return modifiedCategory;
        })
        // const photo = vendorCategories.find(o => o.name === "name");
        //get slug = parent_category
        const occasionItem = await Category.findOne({slug:"parent_category"});
        //get Parent = parent_category.id
        const occationCategories = await Category.find({parent: occasionItem._id});

        const modifiedCategories = occationCategories.map(category => {
            const modifiedCategory = category.toObject(); // Convert to plain JavaScript object
            modifiedCategory.id = modifiedCategory._id.toString(); // Add id property
            delete modifiedCategory._id; // Remove the original _id property
            return modifiedCategory;
        });
        
        let data = [];
        data.push({
            label: "Vendor",
            value: "Vendor",
            items: modifiedVendorList
        })

        data.push({
            label: "Occasion",
            value: "Occasion",
            items: modifiedCategories
        })

        res.status(200).json({data:data})

    }catch(err){
        res.status(500).json({message:err.message})
    }
})
// below api will return data user token not required
router.get("/v1/", async (req, res) => {
    try {
        venueService
            .list(req.query, false)
            .then(venue => {
                res.json({ totalCount: venue.length, data: venue });
            })
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});
router.get("/allVenues", async (req,res) =>{
    try{
        Venue.aggregate([
            {
              $project: {
                // _id: NumberInt(0),
                venues: "$$ROOT",
              },
            },
            {
              $addFields: {
                "venues.cityObjectId": {
                  $toObjectId: "$venues.citycode",
                },
              },
            },
            {
              $lookup: {
                localField: "venues.subareaid",
                from: "subareaes",
                foreignField: "_id",
                as: "subareaes",
              },
            },
            {
              $unwind: {
                path: "$subareaes",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $lookup: {
                localField: "venues.cityObjectId",
                from: "cities",
                foreignField: "_id",
                as: "cities",
              },
            },
            {
              $unwind: {
                path: "$cities",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                name: {
                  $concat: [
                    "$venues.name",
                    ", ",
                    "$subareaes.name",
                    ", ",
                    "$cities.name",
                  ],
                },
                disable: "$venues.disable",
                id: "$venues._id",
                statecode: "$venues.statecode",
                statename: "$venues.statename",
                status: "$venues.status",
                updated_at: "$venues.created_at",
                mode: "venue",
              },
            },
          ]).then(data =>{
            res.status(200).json({data:{
                items: data,
                totalCount: data.length
            }})
          }, err =>{
            res.status(500).json({message: err.message})    
          })
          
    }catch(err){
        res.status(500).json({message: err.message})
    }
})
router.get('/allVenuesOld', async (req,res) =>{
    try{
        let venueList = [];
        const venues = await Venue.find({status:true});
        console.log(venues.length);
        const existingVenue = venueList.find(ven => ven.name === element.name);
        if(!existingVenue){
            venues.forEach(element => {
                const ven = {
                    countryname: "India",
                    disable: element.disable,
                    id: element._id,
                    name: element.name,
                    statecode: element.statecode,
                    statename: element.statename,
                    status: element.status,
                    updated_at: element.created_at,
                    mode: "venue"
                }
                venueList.push(ven)
            });
        }
        res.json({
            data:{
                items: venueList,
                totalCount: venueList.length
            }
        })
    }catch(er){
        res.status(500).json({message: er.message})
    }
})
// Get All Content Listing
router.get("/", auth, async (req, res) => {
    try {
        venueService
            .list(req.query, true)
            .then(venue => {
                res.json({ totalCount: venue.length, data: venue });
            })
    } catch (error) {
        console.log(error, 'err')
        res.json({ message: error });
    }
});

// Get Single Venue below api will return data user token not required
router.get("/v1/:venueId", async (req, res) => {
    try {
        const venue = await venueService.findById(req.params.venueId, false);
        res.json(venue);
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Venue below api will return data user token not required
router.get("/bymeta", async (req, res) => {
    try {
        const venue = await venueService.list(req.query,false);
        const data = venue.items[0];
        data.decor1Price = data.decor1Price || 10000;
        data.decor2Price = data.decor2Price || 45000;
        data.decor3Price = data.decor3Price || "Call for prices";
        data.decor1Image = ['']
        data.decor2Image = ['']
        data.decor3Image = ['']
        res.json(data);
    } catch (error) {
        res.json({ message: error.message });
    }
});

// Get Single Venue
router.get("/:venueId", auth, async (req, res) => {
    try {
        //console.log("with auth");
        const venue = await venueService.findById(req.params.venueId, true);
        res.json(venue);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update 
router.put("/:venueId", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        let updatedFilename = [];

        const venueObj = [];
        venueObj['updated_by'] = ObjectId(userId);
        venueObj['updated_at'] = moment.utc().toDate();
        let oldImagesArr = [];
        let newImageUpdatedArr = [];
        let imageDetails;
        let oldVenueImagesArray = [];
        let oldDecor1ImagesArray = [];
        let oldDecor2ImagesArray = [];
        let oldDecor3ImagesArray = [];
        let venueImageDetails = [];
        let decor1ImageDetails = [];
        let decor2ImageDetails = [];
        let decor3ImageDetails = [];
        let venueDetails = await venueService.findById(req.params.venueId);
        //console.log('venueDetails', venueDetails);
        if (venueDetails != undefined) {
            venueImageDetails = venueDetails.venueImage;
            decor1ImageDetails = venueDetails.decor1Image;
            decor2ImageDetails = venueDetails.decor2Image;
            decor3ImageDetails = venueDetails.decor3Image;

            let image;
            let newImagesArr = [];
            let deletedImages = [];

            if (venueImageDetails.length > 0) {
                oldVenueImagesArray = await getOldImagesArray(venueImageDetails);
            }
            if (decor1ImageDetails.length > 0) {
                oldDecor1ImagesArray = await getDecorOldImagesArray(decor1ImageDetails);
            }
            if (decor2ImageDetails.length > 0) {
                oldDecor2ImagesArray = await getDecorOldImagesArray(decor2ImageDetails);
            }
            if (decor3ImageDetails.length > 0) {
                oldDecor3ImagesArray = await getDecorOldImagesArray(decor3ImageDetails);
            }
        }
        let venueImagesArray = [];
        let newDecor1ImagesArray = [];
        let newDecor2ImagesArray = [];
        let newDecor3ImagesArray = [];
        let newImagesArr = [];
        let deletedVenueImages = [];
        let deletedDecor1Images = [];
        let deletedDecor2Images = [];
        let deletedDecor3Images = [];
        const userObj = [];
        userObj['updated_by'] = ObjectId(userId);
        userObj['updated_at'] = moment.utc().toDate();
        const userData = await userService.finddetailById(req.body.userid);
        //return;
        for (var key in req.body) {
            if (key == "currentPassword" && req.body.currentPassword != "" && req.body.password != "" && req.body.confirmPassword != "" && req.body.password == req.body.confirmPassword) {
                const { passwordHash } = cipher.sha512(req.body.currentPassword, userData.salt);
                if (userData.passwordHash !== passwordHash) {
                    res.status(400).json({ message: "Invalid Current Password", status: 400 });
                    return;
                } else {
                    const { salt, passwordHash } = cipher.saltHashPassword(req.body.password);
                    userObj['salt'] = salt;
                    userObj['passwordHash'] = passwordHash;
                }
            }
            if (key == 'profilepic' && req.body.profilepic != "") {
                const profilepicData = req.body.profilepic;
                const fileType = profilepicData.match(/[^:/]\w+(?=;|,)/)[0];
                profilepicfilename = uuidv1() + "." + fileType;
                profilepicpath = picture.profilePicFolder + profilepicfilename;
                let profileFilename = "";
                profileFilename = __dirname + "/../../../" + profilepicpath;

                var base64Data;
                if (req.body.profilepic.indexOf("data:image/png;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/png;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpg;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpg;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpeg") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpeg;base64,/, "");
                }

                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {
                    require("fs").writeFile(profileFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    userObj['profilepic'] = profilepicfilename;
                }
            }
            if (key == "ownerfirstName" || key == "ownerlastName" || key == "ownergender" || key == "ownermobileNumber") {
                userObj['firstName'] = req.body['ownerfirstName'];
                userObj['lastName'] = req.body['ownerlastName'];
                userObj["fullName"] = req.body['ownerfirstName'] + " " + req.body['ownerlastName'];
                userObj['gender'] = req.body['ownergender'];
                userObj['mobileNumber'] = req.body['ownermobileNumber'];
            }
            if (key == "disable" && req.body.disable == true) {
                venueObj['disable'] = req.body[key];
                venueObj['deleted_by'] = ObjectId(userId);
                venueObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status" || key == "assured") {
                venueObj[key] = req.body[key];
            } else if (key == "subareaid") {
                venueObj[key] = ObjectId(req.body[key]);
            } else if (key == 'venueImage' && req.body.venueImage != "") {
                req.body.venueImage.forEach(element => {
                    const venueImageFile = element.file;
                    const fileType = venueImageFile.match(/[^:/]\w+(?=;|,)/)[0];
                    updatedDecorFile = uuidv1() + "." + fileType;
                    //updatedFilename.push(venueImageOb = {venue_image_src:updatedDecorFile});
                    bannerPath = picture.venuePicFolder + updatedDecorFile;
                    let venueImageFilename = "";
                    venueImageFilename = __dirname + "/../../../" + bannerPath;

                    var base64Data;
                    if (venueImageFile.indexOf("data:image/png;") !== -1) {
                        base64Data = venueImageFile.replace(/^data:image\/png;base64,/, "");
                    } else if (venueImageFile.indexOf("data:image/jpg;") !== -1) {
                        base64Data = venueImageFile.replace(/^data:image\/jpg;base64,/, "");
                    } else if (venueImageFile.indexOf("data:image/jpeg") !== -1) {
                        base64Data = venueImageFile.replace(/^data:image\/jpeg;base64,/, "");
                    }

                    if (typeof base64Data == 'undefined') {
                        res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                    } else if (base64Data != "") {
                        let isFounded = oldVenueImagesArray.includes(venueImageFilename);
                        if (isFounded === false) {
                            require("fs").writeFile(venueImageFilename, base64Data, 'base64', function (err) {
                                console.log(err);
                            });
                            newImagesArr.push({ venue_image_src: updatedDecorFile, alt: element.alt, default: element.default });
                        }
                    }
                });
            } else if (key == 'decor1Image' && req.body.decor1Image != "") {
                newDecor1ImagesArray = await updateDecorImage(req.body.decor1Image, oldDecor1ImagesArray);
            } else if (key == 'decor2Image' && req.body.decor2Image != "") {
                newDecor2ImagesArray = await updateDecorImage(req.body.decor2Image, oldDecor2ImagesArray);
            } else if (key == 'decor3Image' && req.body.decor3Image != "") {
                newDecor3ImagesArray = await updateDecorImage(req.body.decor3Image, oldDecor3ImagesArray);
            } else if (key == 'venue_deleted_images' && req.body.venue_deleted_images != "") {
                req.body.venue_deleted_images.forEach(element => {
                    deletedVenueImages.push({ venue_image_src: element.replace(frontEnd.picPath + '/' + picture.showVenuePicFolderPath, '') });
                });
            } else if (key == 'decor_1_deleted_images' && req.body.decor_1_deleted_images != "") {
                req.body.decor_1_deleted_images.forEach(element => {
                    deletedDecor1Images.push({ venue_image_src: element.replace(frontEnd.picPath + '/' + picture.showDecorPicFolderPath, '') });
                });
            } else if (key == 'decor_2_deleted_images' && req.body.decor_2_deleted_images != "") {
                req.body.decor_2_deleted_images.forEach(element => {
                    deletedDecor2Images.push({ venue_image_src: element.replace(frontEnd.picPath + '/' + picture.showDecorPicFolderPath, '') });
                });
            } else if (key == 'decor_3_deleted_images' && req.body.decor_3_deleted_images != "") {
                req.body.decor_3_deleted_images.forEach(element => {
                    deletedDecor3Images.push({ venue_image_src: element.replace(frontEnd.picPath + '/' + picture.showDecorPicFolderPath, '') });
                });
            } else if (key == "venueVideo") {
                videoFilename = uuidv1() + ".mp4";
                videoFilepath = picture.venueVideoFolder + videoFilename;
                videoFilePathname = __dirname + "/../../../" + videoFilepath;
                var base64Data;
                base64Data = req.body.venueVideo;
                if (base64Data.indexOf("data:video/mp4;") !== -1) {
                    base64Data = base64Data.replace(/^data:video\/mp4;base64,/, "");
                }

                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only Video file allowed!!" });
                } else if (base64Data != "") {

                    require("fs").writeFile(videoFilePathname, base64Data, 'base64', async function (err) {
                        if (err != null) {
                            console.log("FILE UPLOAD Error: ", err);
                        }
                        var venuevideoObj = [];
                        venuevideoObj['venueVideo'] = videoFilename;
                        const updateVideoData = Object.assign({}, venuevideoObj);
                        venueService.updatevenue(req.params.venueId, updateVideoData);
                    });
                }
            } else {
                venueObj[key] = req.body[key];
            }
        }

        const venueImagesDetailsArr = oldVenueImagesArray.concat(newImagesArr);
        const decor1ImagesDetailsArr = oldDecor1ImagesArray.concat(newDecor1ImagesArray);
        const decor2ImagesDetailsArr = oldDecor2ImagesArray.concat(newDecor2ImagesArray);
        const decor3ImagesDetailsArr = oldDecor3ImagesArray.concat(newDecor3ImagesArray);


        deletedVenueImages.forEach(item => {
            let removeIndex = findIndexByName(item.venue_image_src, venueImagesDetailsArr);
            if (removeIndex != -1) {
                venueImagesDetailsArr.splice(removeIndex, 1);
            }
        });

        deletedDecor1Images.forEach(item => {
            let removeIndex = findIndexByName(item.venue_image_src, decor1ImagesDetailsArr);
            // console.log('item.venue_image_src', item.venue_image_src);
            // console.log('decor1ImagesDetailsArr', decor1ImagesDetailsArr);
            if (removeIndex != -1) {
                decor1ImagesDetailsArr.splice(removeIndex, 1);
            }
        });
        // console.log('deletedDecor2Images', deletedDecor2Images);
        deletedDecor2Images.forEach(item => {
            let removeIndex = findIndexByName(item.venue_image_src, decor2ImagesDetailsArr);
            if (removeIndex != -1) {
                decor2ImagesDetailsArr.splice(removeIndex, 1);
            }
        });
        deletedDecor3Images.forEach(item => {
            let removeIndex = findIndexByName(item.venue_image_src, decor3ImagesDetailsArr);
            if (removeIndex != -1) {
                decor3ImagesDetailsArr.splice(removeIndex, 1);
            }
        });

        venueObj['venueImage'] = venueImagesDetailsArr;
        venueObj['decor1Image'] = decor1ImagesDetailsArr;
        venueObj['decor2Image'] = decor2ImagesDetailsArr;
        venueObj['decor3Image'] = decor3ImagesDetailsArr;

        delete venueObj['venue_deleted_images'];
        delete venueObj['decor_1_deleted_images'];
        delete venueObj['decor_2_deleted_images'];
        delete venueObj['decor_3_deleted_images'];
        delete venueObj['ownerfirstName'];
        delete venueObj['ownergender'];
        delete venueObj['ownerlastName'];
        delete venueObj['ownermobileNumber'];
        delete venueObj['currentPassword'];
        delete venueObj['password'];
        delete venueObj['confirmPassword'];


        const updateData = Object.assign({}, venueObj);
        const updateUserData = Object.assign({}, userObj);

        await venueService.updatevenue(req.params.venueId, updateData).then(async updatedData => {
            await userService.updateUser(req.body.userid, updateUserData);
            res.json({ message: "Data Updated Successfully", data: updatedData });
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
});

async function getOldImagesArray(venueImageDetails) {
    let oldImagesArr = [];
    venueImageDetails.forEach(element => {
        image = element.venue_image_src;
        //console.log('image', image);
        if (image !== undefined) {
            imageDetails = image.replace(frontEnd.picPath + '/' + picture.showVenuePicFolderPath, '');
            oldImagesArr.push({ venue_image_src: imageDetails, alt: element.alt, default: element.default });
        }


    });
    return oldImagesArr;
}
async function getDecorOldImagesArray(decorImageDetails) {
    let oldImagesArr = [];
    decorImageDetails.forEach(element => {
        //console.log(element);
        image = element.venue_image_src;
        //console.log('image', image);
        imageDetails = image.replace(frontEnd.picPath + '/' + picture.showDecorPicFolderPath, '');
        oldImagesArr.push({ venue_image_src: imageDetails, alt: element.alt, default: element.default });

    });
    return oldImagesArr;
}
/** Update Decor image function */
async function updateDecorImage(decorImage, oldImagesArr) {
    if (decorImage) {
        let newImagesArr = [];
        decorImage.forEach(element => {
            const bannerData = element.file;
            const fileType = bannerData.match(/[^:/]\w+(?=;|,)/)[0];
            updatedDecorFile = uuidv1() + "." + fileType;
            //updatedFilename.push(venueImageOb = {venue_image_src:updatedDecorFile});
            bannerPath = picture.decorPicFolder + updatedDecorFile;
            let decorImageFilename = "";
            decorImageFilename = __dirname + "/../../../" + bannerPath;

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
                let isFounded = oldImagesArr.includes(decorImageFilename);
                if (isFounded === false) {
                    require("fs").writeFile(decorImageFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    newImagesArr.push({ venue_image_src: updatedDecorFile, alt: element.alt, default: element.default });
                }
            }
        });
        let updatedDecorImagesArray = [
            {
                'newImagesArr': newImagesArr,

            }
        ];
        return newImagesArr;
    }

}

function findIndexByName(name, arrayName) {
    let index = -1;
    for (let i = 0; i < arrayName.length; i++) {
        if (arrayName[i].venue_image_src === name) {
            index = i;
            break;
        }
    }
    return index;
}
//Delete Content
router.delete("/:venueId", auth, async (req, res) => {
    try {
        const removeLesson = await venueService.findByIdAndDelete(req.params.venueId);
        res.json({ message: "Data Deleted Successfully" });
    } catch (error) {
        res.json({ message: error });
    }
});

function randomString(len, an) {
    an = an && an.toLowerCase();
    var str = "",
        i = 0,
        min = an == "a" ? 10 : 0,
        max = an == "n" ? 10 : 62;
    for (; i++ < len;) {
        var r = Math.random() * (max - min) + min << 0;
        str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
    }
    return str;
}
const parent_category = [];
function getCategory() {
    var query = { filterByDisable: false, filterByStatus: true };
    let parentCategory;
    categoryService.list(query, true).then(
        data => {
            parentCategory = data.items;
            let obj = parentCategory.find(o => o.slug === "parent_category");
            if (obj.id) {
                var query1 = { filterByDisable: false, filterByStatus: true, filterByParent: obj.id };
                categoryService.list(query1).then(
                    data => {
                        var catlist = data.items;
                        catlist.forEach(element => {
                            parent_category.push({ id: element.id, name: element.name });
                        })

                    },

                    err => {
                        this.errorMessage = err.error.message;
                    }
                );
            }
        },
        err => {
            this.errorMessage = err.error.message;
        }
    );
}


router.post("/uploadCSV", auth, async (req, res) => {
    try {
        //await getCategory();
        var query = { filterByDisable: false, filterByStatus: true };
        let parentCategory = [];
        let imagePresent = [];
        let imageNotPresent = [];
        const subarealist = await subareaService.list(query);
        categoryService.list(query, true).then(
            async data => {
                parentCategory = data.items;
                // console.log(parentCategory);
                const userId = cipher.getUserFromToken(req);
                const venueObj = [];
                let venueData = [];
                venueObj['updated_by'] = ObjectId(userId);
                venueObj['updated_at'] = moment.utc().toDate();
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
                            require('fs').createReadStream(csvPicFilename)
                                .pipe(parse({ delimiter: ",", from_line: 2 }))
                                .on("data", (row) => {
                                    if (row[0] !== "") { 
                                        var venueImagefilename = [];
                                        var decor1Imagefilename = [];
                                        var decor2Imagefilename = [];
                                        var decor3Imagefilename = [];
                                        if (row[37] !== "") { 
                                            let venueImage = row[37].split(",");
                                            venueImage.forEach(element => {
                                                const imageName = element.trim();
                                                if (imageName && imageName.length > 0) {
                                                    let image = picture.venuePicFolder + imageName;
                                                    if (fs.existsSync(image)) {
                                                        //image exists
                                                        imagePresent.push(imageName)
                                                        venueImagefilename.push({ venue_image_src: element.trim(), alt: '', default: '' });
                                                    } else {
                                                        //non uploaded images
                                                        imageNotPresent.push(imageName)
                                                    }
                                                }

                                            });
                                        }
                                        if (row[38] !== "") {
                                            let decor1Image = row[38].split(",");
                                            decor1Image.forEach(element => {
                                                decor1Imagefilename.push({ venue_image_src: element.trim(), alt: '', default: '' });
                                            });
                                        }
                                        if (row[39] !== "") {
                                            let decor2Image = row[39].split(",");
                                            decor2Image.forEach(element => {
                                                decor2Imagefilename.push({ venue_image_src: element.trim(), alt: '', default: '' });
                                            });
                                        }
                                        if (row[40] !== "") {
                                            let decor3Image = row[40].split(",");
                                            decor3Image.forEach(element => {
                                                decor3Imagefilename.push({ venue_image_src: element.trim(), alt: '', default: '' });
                                            });
                                        }
                                        var categoryarray = [];
                                        if (row[3] !== "") {
                                            let categoryStr = row[3].split(",");
                                            categoryStr.forEach(element => {
                                                if (element !== "") {
                                                    const categoryobj = parentCategory.find(o => o.name === element.trim());
                                                    if (categoryobj['id']) {
                                                        categoryarray.push({ 'id': categoryobj['id'].toString(), name: categoryobj['name'] },);
                                                    }
                                                }
                                            });
                                        }

                                        var foodTypearray = [];
                                        if (row[4] !== "") {
                                            let foodTypeStr = row[4].split(",");
                                            foodTypeStr.forEach(element => {
                                                if (element !== "") {
                                                    const foodTypeobj = parentCategory.find(o => o.name === element.trim());
                                                    if (foodTypeobj && foodTypeobj['id']) {
                                                        foodTypearray.push({ 'id': foodTypeobj['id'].toString(), name: foodTypeobj['name'], slug: foodTypeobj['slug'] },);
                                                    }
                                                }
                                            });
                                        }
                                        //return;
                                        var propertyTypearray = [];
                                        if (row[5] !== "") {
                                            let propertyTypeStr = row[5].split(",");
                                            propertyTypeStr.forEach(element => {
                                                if (element !== "") {
                                                    const propertyTypeobj = parentCategory.find(o => o.name === element.trim());
                                                    if (propertyTypeobj != undefined) {
                                                        propertyTypearray.push({ 'id': propertyTypeobj['id'].toString(), name: propertyTypeobj['name'] },);
                                                    }
                                                }
                                            });
                                        }

                                        var subareadId;
                                        if (row[23] !== "") {
                                            const sublist = subarealist.items;
                                            const subareadobj = sublist.find(o => o.name === row[23]);
                                            if (subareadobj != undefined) {
                                                subareadId = subareadobj['id'];
                                            }
                                        }

                                        let foodMenuType = {};
                                        foodTypearray.forEach(element => {
                                            let columnIndex = element.slug === "veg_food" ? 42 : element.slug === "non_veg" ? 43 : element.slug === "mixFood" ? 44 : 45;
                                                const rowData = row[columnIndex].split(",");

                                                const foodData = [
                                                    {
                                                        slug: '1X1',
                                                        value: rowData[0] ? rowData[0].trim() : '0',
                                                        disabled: rowData[0] ? false : true,
                                                    },
                                                    {
                                                        slug: '2X2',
                                                        value: rowData[1] ? rowData[1].trim() : '0',
                                                        disabled: rowData[1] ? false : true,
                                                    },
                                                    {
                                                        slug: '3X3',
                                                        value: rowData[2] ? rowData[2].trim() : '0',
                                                        disabled: rowData[2] ? false : true,
                                                    },
                                                    {
                                                        slug: '4X4',
                                                        value: rowData[3] ? rowData[3].trim() : '0',
                                                        disabled: rowData[3] ? false : true,
                                                    },
                                                    {
                                                        slug: '5X5',
                                                        value: rowData[4] ? rowData[4].trim() : '0',
                                                        disabled: rowData[4] ? false : true,
                                                    }
                                                ];
                                                
                                                // Additional check for length
                                                foodData.forEach(item => {
                                                    if (item.value.length === 0) {
                                                        item.value = '0';
                                                        item.disabled = true;
                                                    }
                                                });


                                                // let data = [];
                                                // let len = rowData.length;                                                
                                                // for(let i = 0; i < len;i++){
                                                //     if(i === 0){
                                                //         data.push({
                                                //             slug:'1X1',
                                                //             value:rowData[0].trim(),
                                                //         })
                                                //     }
                                                //     if(i === 1){
                                                //         data.push({
                                                //             slug:'2X2',
                                                //             value:rowData[1].trim(),
                                                //         })
                                                //     }
                                                //     if(i === 2){
                                                //         data.push({
                                                //             slug:'3X3',
                                                //             value:rowData[2].trim(),
                                                //         })
                                                //     }
                                                //     if(i === 3){
                                                //         data.push({
                                                //             slug:'4X4',
                                                //             value:rowData[3].trim(),
                                                //         })
                                                //     }
                                                //     if(i === 4){
                                                //         data.push({
                                                //             slug:'5X5',
                                                //             value:rowData[4].trim(),
                                                //         })
                                                //     }
                                                // }
                                                foodMenuType[element.slug] = foodData;
                                        });

                                        // const categoryobj = parentCategory.find(o => o.name === row[3]);
                                        // const foodTypeobj = parentCategory.find(o => o.name === row[4]);
                                        // const propertyTypeobj = parentCategory.find(o => o.name === row[5]);

                                        // console.log(categoryarray);
                                        //console.log(foodTypearray);
                                        //console.log(propertyTypearray);
                                        //return;
                                        var passwordStr = randomString(10);
                                        categoryId = null;
                                        const { salt, passwordHash } = cipher.saltHashPassword(passwordStr);
                                        userObj = new User({
                                            firstName: row[31],
                                            lastName: row[32],
                                            email: row[33],
                                            fullName: row[31] + " " + row[32],
                                            role: row[34],
                                            //organizationId: ObjectId(req.body.organizationId),
                                            //age: req.body.age,
                                            status: true,
                                            disable: false,
                                            address: row[6].replace(/[\r\n]/gm, ' '),
                                            salt: salt,
                                            passwordHash: passwordHash,
                                            passwordStr: passwordStr,
                                            gender: row[36],
                                            category: categoryId,
                                            mobileNumber: row[35],
                                            zipcode: row[7].toString(),
                                            //profilepic: profilepicfilename,
                                            countrycode: row[18],
                                            countryname: "India",
                                            statecode: row[19],
                                            statename: row[20],
                                            citycode: row[21],
                                            cityname: row[22],
                                            created_by: userId,
                                            updated_by: ObjectId(userId),
                                        });



                                        userService
                                            .addUser(userObj)
                                            .then(async user => {
                                                const venueObj = new Venue({
                                                    name: row[0],
                                                    //categoryId: ObjectId(req.body.categoryId),            
                                                    // mobileNumber: row[1].toString(),
                                                    mobileNumber: row[35],
                                                    email: row[2],
                                                    //category: { 'id': categoryobj['id'].toString(), name: categoryobj['name'] },
                                                    category: categoryarray,
                                                    //foodType: { 'id': foodTypeobj['id'].toString(), name: foodTypeobj['name'], slug: foodTypeobj['slug'] }, //foodTypeobj['id'],
                                                    foodType: foodTypearray,
                                                    //propertyType: { 'id': propertyTypeobj['id'].toString(), name: propertyTypeobj['name'] }, //propertyTypeobj['id'],
                                                    propertyType: propertyTypearray,
                                                    address: row[6].replace(/[\r\n]/gm, ' '),
                                                    zipcode: row[7].toString(),
                                                    area: row[8],
                                                    capacity: row[9],
                                                    theaterSitting: row[10],
                                                    acdetails: row[11],
                                                    parkingdetails: row[12],
                                                    kitchendetails: row[13],
                                                    capacityDescription: row[14],
                                                    decorationdetails: row[15],
                                                    amenities: row[16],
                                                    roundTable: row[17],
                                                    countrycode: row[18],
                                                    statecode: row[19],
                                                    statename: row[20],
                                                    citycode: row[21],
                                                    cityname: row[22],
                                                    subareaid: ObjectId(subareadId), //row[23],
                                                    description: row[24],
                                                    shortdescription: row[25],
                                                    assured: row[26].toLowerCase(),
                                                    venueImage: venueImagefilename,
                                                    decor1Image: decor1Imagefilename,
                                                    decor2Image: decor2Imagefilename,
                                                    decor3Image: decor3Imagefilename,
                                                    maxPrice: row[27],
                                                    decor1Price: row[28],
                                                    decor2Price: row[29],
                                                    decor3Price: row[30],
                                                    venueVideo: row[41],
                                                    minPrice: 0,//row[42], //change minPrice
                                                    venuePrice: row[27] == null || row[27] == undefined ? 0 : row[27],// row[43], 
                                                    ownerId: user.insertedId,
                                                    created_by: userId,
                                                    updated_by: ObjectId(userId),
                                                    foodMenuType:foodMenuType,
                                                    metaUrl: row[46],
                                                    metaDescription: row[47],
                                                    metaKeywords: row[48]
                                                });
                                                
                                                // console.log(JSON.stringify(venueObj));
                                                //venueData.push(venueObj);

                                                const InsertedVendor = await venueService.addvenue(venueObj);
                                                const vId = InsertedVendor.insertedId;
                                                const startDate = new Date('2023-12-01T00:00:00.000Z');
                                                const endDate = new Date('2024-02-28T00:00:00.000Z');

                                                let currentDate = new Date(startDate);
                                                while (currentDate <= endDate) {
                                                    const venueSlots = [];
                                                    const dayOfWeek = currentDate.getDay();
                                                    const dayOfWeekString = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

                                                    for (let w = 0; w < 3; w++) {
                                                    const postAvailability = {
                                                        slotdate: currentDate,
                                                        slotenddate: currentDate,
                                                        slotday: dayOfWeekString,
                                                        venueId: vId,
                                                        //local slots
                                                        slotId: w === 0 ? ObjectId('655b060b47c5cd1257b70bf1') : w === 1 ? ObjectId('655b060b47c5cd1257b70bf2') : ObjectId('655b060b47c5cd1257b70bf3'),
                                                        // slotId: w === 0 ? ObjectId('654ce76fe5621671d5dbeacd') : w === 1 ? ObjectId('654ce76fe5621671d5dbeace') : ObjectId('654ce76fe5621671d5dbeacf'),
                                                        recurring: true,
                                                        status: true,
                                                        disable: false,
                                                        created_by: ObjectId(userId),
                                                        updated_by: ObjectId(userId)
                                                        // created_by: ObjectId('655b060b47c5cd1257b70be8'),
                                                        // updated_by: ObjectId('655b060b47c5cd1257b70be8')
                                                    };
                                                    venueSlots.push(postAvailability);
                                                    }
                                                    await postavailabilityService.addMany(venueSlots);
                                                    currentDate.setDate(currentDate.getDate() + 1);
                                                }

                                                //     .then(async venue => {
                                                //         res.json({ message: "Data Inserted Successfully", id: venue.insertedId });
                                                //     })
                                                //     .catch(err => res.status(400).send({ error: err.message }));
                                            });

                                    }
                                }).on('end', () => {
                                    res.json({ message: "Data Inserted Successfully" });
                                    // console.log(venueData);
                                    // if (venueData.length > 0) {                                    
                                    //     venueService
                                    //         .addMany(venueData)
                                    //         .then(venues => {
                                    //             console.log(venues);
                                    //             res.json({ message: "Data Inserted Successfully" });
                                    //         })
                                    //         .catch(err => res.status(400).send({ error: err.message }));
                                    // } else {
                                    //     res.json({ message: "No Data" });
                                    // }
                                })
                        } else {
                            res.json({ message: "CSV file Not exist" });
                        }
                    });
                    //lessonObj['csvFile'] = csvfilename;            

                }
            });
        // let csvpath = __dirname + "/../../public/uploads/csv/CSV_APC-Group-prepopulated-data.csv";

    } catch (error) {
        res.json({ message: error });
    }
});


module.exports = router;