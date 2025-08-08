const router = require("express").Router()
const Vendor = require("../../../model/Vendor")
const City = require("../../../model/City")
const Subarea = require("../../../model/Subarea")
const VendorService = require('./vendorService')
const vendorService = new VendorService();
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const CategoryService = require("../category/categoryService");
const categoryService = new CategoryService();
const uuidv1 = require('uuid');
const { picture, frontEnd } = require('config');
const { parse } = require("csv-parse");
const StateService = require("../state/stateService");
const stateService = new StateService();
const CityService = require("../city/cityService");
const cityService = new CityService();
const SubareaService = require("../subarea/subareaService");
const User = require("../../../model/User");
const { ObjectId } = require("mongodb");
const subareaService = new SubareaService();
const UserService = require('../user/userService');
const userService = new UserService();
const mongoose = require('mongoose');

router.post("/uploadCSV", auth, (req, res) => {

    try {

        const userId = cipher.getUserFromToken(req);
        //live categori id 654ce76fe5621671d5dbeaca
        // local category id 655b060b47c5cd1257b70bee
        categoryService.getCategoriesByParentId("654ce76fe5621671d5dbeaca").then(async vendorCategories => {
            // console.log(vendorCategories);
            const stateData = await stateService.list();
            let base64Data = req.body.csvFile;
            let csvFileName = uuidv1() + ".csv";
            let csvFileSavePath = picture.vendorCSVFolder + csvFileName;
            let finalCsvFilePath = __dirname + "/../../../" + csvFileSavePath;
            if (base64Data.indexOf("data:text/csv;") !== -1) {
                base64Data = base64Data.replace(/^data:text\/csv;base64,/, "");
            } else if (base64Data.indexOf("data:application/vnd.ms-excel;") !== -1) {
                base64Data = base64Data.replace(/^data:application\/vnd.ms-excel;base64,/, "");
            }
            if (typeof base64Data == 'undefined') {
                res.json({ code: 500, message: "Only CSV file allowed!!" })
            } else if (base64Data != "") {
                await require("fs").writeFile(finalCsvFilePath, base64Data, 'base64', (err) => {
                    if (err) console.log("FILE UPLOAD Error: ", err);
                    if (require('fs').existsSync(finalCsvFilePath)) {
                        require('fs').createReadStream(finalCsvFilePath)
                            .pipe(parse({ delimiter: ',', from_line: 2 }))
                            .on('data', async (row) => {
                                // console.log(row);
                                const vendorImagesArray = row[16].split(', ');
                                const vendroImages = [];
                                vendorImagesArray.forEach(element => {
                                    const imageName = element.trim();
                                    if (imageName && imageName.length > 0) {
                                        let image = picture.vendorPicFolder + imageName;
                                        if (require('fs').existsSync(image)) {
                                            //image exists
                                            // imagePresent.push(imageName) //image present
                                            vendroImages.push({ vendor_image: element.trim(), alt: row[0], default: '' });
                                        } else {
                                            //non uploaded images
                                            // imageNotPresent.push(imageName) //image not present
                                        }
                                    }

                                });
                                const filterCategory = vendorCategories.filter(o => o.name == row[3]);
                                const category = filterCategory.map(o => ({ id: o._id, name: o.name }));
                                const filteredState = stateData.items.filter(o => o.name === row[4]);
                                const cityData = await cityService.findCityByName(row[5])
                                const subArea = await subareaService.findBySubAreaName(row[6])
                                const servicesData = row[9].split(', ');
                                let servicesWithPrice = [];

                                if(category[0].name === 'Photographer'){
                                    let splitsOf4Hours = row[28].split(", ");
                                    let splitsOf8Hours = row[29].split(", ");
                                    let splitsOf12Hours = row[30].split(", ");
                                    for (let i = 0; i < servicesData.length; i++) {
                                        let element = servicesData[i];
                                        let splitsOfService = element.split(":");
                                        // console.log(splitsOfService);
                                        servicesWithPrice.push({
                                            name: splitsOfService[0],
                                            price: splitsOfService[1],
                                            fullDayPrice: parseInt(splitsOfService[1].match(/\d+/)[0]),
                                            hours4Price: parseInt(splitsOf4Hours[i].match(/\d+/)[0]),
                                            hours8Price: parseInt(splitsOf8Hours[i].match(/\d+/)[0]),
                                            hours12Price: parseInt(splitsOf12Hours[i].match(/\d+/)[0]),
                                            actualPrice: parseInt(splitsOfService[1].match(/\d+/)[0]),
                                            slug: createSlug(splitsOfService[0])
                                        })
                                }
                                }else{
                                    servicesData.forEach(element => {
                                        let splitsOfService = element.split(":");
                                        if(splitsOfService.length >= 2){
                                            servicesWithPrice.push({
                                                name: splitsOfService[0],
                                                price: splitsOfService[1],
                                                actualPrice: parseInt(splitsOfService[1].match(/\d+/)[0]),
                                                slug: createSlug(splitsOfService[0])
                                            })
                                        }
                                    })
                                }
                                // servicesData.forEach(element => {
                                //     let splitsOfService = element.split(":");
                                //     // console.log(splitsOfService);
                                //     servicesWithPrice.push({
                                //         name: splitsOfService[0],
                                //         price: splitsOfService[1],
                                //         fullDayPrice:parseInt(splitsOfService[1].match(/\d+/)[0]),
                                //         hours4Price:parseInt(splitsOfService[1].match(/\d+/)[0])[1],
                                //         hours8Price:0,
                                //         hours12Price:0,
                                //         actualPrice: parseInt(splitsOfService[1].match(/\d+/)[0]),
                                //         slug: createSlug(splitsOfService[0])
                                //     })
                                // })
                                const minVendorPrice = servicesWithPrice.reduce((minPrice, service) => {
                                    const price = parseInt(service.price.match(/\d+/)[0]);
                                    return Math.min(minPrice, price);
                                }, Infinity);
                                // console.log(servicesWithPrice);
                                let availableCities = []
                                const availableCitiesArray = await cityService.findCityByCityNameList(row[11].split(', '));
                                availableCitiesArray.forEach(element => {
                                    availableCities.push({
                                        cityid: element._id,
                                        cityname: element.name
                                    })
                                });
                                let otherServices = {};
                                if (category && category[0].name === 'Decorater') {
                                    servicesWithPrice.forEach(element => {
                                        let columnIndex = element.slug === 'floral' ? 28
                                            : element.slug === 'rajasthani' ? 29
                                                : element.slug === 'punjabi' ? 30
                                                    : element.slug === 'south_indian' ? 31
                                                        : element.slug === 'royal' ? 32
                                                            : element.slug === 'bollywood' ? 33
                                                                : 28;
                                        const rowData = row[columnIndex].split(', ');
                                        let data = [];
                                        let len = rowData.length;
                                        for (let i = 0; i < len; i++) {
                                            if (i === 0) {
                                                data.push({
                                                    slug: "silver",
                                                    name: "Silver",
                                                    value: rowData[i]
                                                })
                                            }
                                            if (i === 1) {
                                                data.push({
                                                    slug: "gold",
                                                    name: "Gold",
                                                    value: rowData[i]
                                                })
                                            }
                                            if (i === 2) {
                                                data.push({
                                                    slug: "platinum",
                                                    name: "Platinum",
                                                    value: rowData[i]
                                                })
                                            }
                                        }
                                        otherServices[element.slug] = data;
                                    });
                                }

                                //add user object
                                const passwordStr = randomString(10);
                                const { salt, passwordHash } = cipher.saltHashPassword(passwordStr);
                                const userObj = new User({
                                    firstName: row[18],
                                    lastName: row[19],
                                    email: row[20],
                                    fullName: row[18] + " " + row[19],
                                    role: row[21],
                                    status: true,
                                    disable: false,
                                    address: null,
                                    salt: salt,
                                    passwordHash: passwordHash,
                                    passwordStr: passwordStr,
                                    gender: row[23],
                                    category: null,
                                    mobileNumber: row[22],
                                    countrycode: "IN",
                                    countryname: "India",
                                    statecode: filteredState[0].id,
                                    statename: filteredState[0].name,
                                    citycode: cityData._id,
                                    cityname: cityData.name,
                                    created_by: userId,
                                    updated_by: ObjectId(userId),
                                })
                                userService.addUser(userObj).then(async user => {
                                    //prepare vendorObject
                                    const vendorObj = new Vendor({
                                        name: row[0],
                                        contact: row[1],
                                        email: row[2],
                                        categories: category,
                                        state: { id: filteredState[0]['_id'], name: filteredState[0]['name'] },
                                        city: { id: cityData._id, name: cityData.name },
                                        subarea: { id: subArea[0]._id, name: subArea[0].name },
                                        googleRating: row[7],
                                        eazyvenueRating: row[8],
                                        services: servicesWithPrice,
                                        otherServices: otherServices,
                                        deal: row[10],
                                        availableInCities: availableCities,
                                        responseTime: row[12],
                                        workExperience: row[13],
                                        shortDescription: row[14],
                                        longDescription: row[15],
                                        images: vendroImages,
                                        status: row[17],
                                        disable: false,
                                        zipcode: row[24],
                                        metaUrl: row[25],
                                        metaDescription: row[26],
                                        metaKeywords: row[27],
                                        minVendorPrice: minVendorPrice,
                                        userId: user.insertedId,
                                        created_by: userId,
                                        updated_by: ObjectId(userId),
                                    })
                                    await vendorService.addVendor(vendorObj)
                                })

                                //add vendor object

                                // console.log(vendorObj);
                            }).on('end', () => {
                                res.json({ message: "Data Inserted Successfully" });
                                //read complete
                            })
                    }
                })
            } else {
                res.json({ message: "CSV file Not exist" });
            }

        });



    } catch (err) {
        res.json({ code: 500, message: err.message })
    }
})

// router.get("/",(req,res) => {

//     let data 
//     categoryService.getCategoriesByParentId("65531fb35f4a43387d505eb3").then(d => {

//         res.json({code: 200, message:d})
//     }).catch(e => {
//         res.json({code: 500, message:e.message})
//     })
// })

function createSlug(input) {
    return input.toLowerCase().replace(/ /g, '_');
}

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
router.get("/sitemapUrl", async (req, res) => {
    try {
      const vendorList = await Vendor.find({});
      let metaUrls = [];
  
      for (const vendor of vendorList) {
        const categoryName = vendor.categories && vendor.categories[0] ? vendor.categories[0].name : "";
        const metaUrl = vendor.metaUrl || "";
        const city = vendor.city.name;
        const slug = createSlug(city + "/" + categoryName + "/" + metaUrl);
        metaUrls.push("https://eazyvenue.com/vendor-detail/"+slug);
      }
  
      res.status(200).json({ data: metaUrls });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
// Get All Content Listing
router.get("/", auth, async (req, res) => {
    try {
        vendorService
            .list(req.query, true)
            .then(venue => {
                res.json({ totalCount: venue.length, data: venue });
            })
    } catch (error) {
        console.log(error, 'err')
        res.json({ message: error });
    }
});
router.get("/getVendorByMetaUrl", async (req, res) => {
    try {
        const metaUrl = req.query.metaUrl;
        const slot = req.query.slot;
        const vendor = await Vendor.findOne({ metaUrl: metaUrl });
        vendor.views = vendor.views + 1;
        await vendor.save();
        let response = [];
        let imagePath = [];
        if (vendor.images !== 'undefined' && vendor.images !== null) {
            vendor.images.forEach(img => {
                imagePath.push(
                    {
                        vendor_image_src: frontEnd.picPath + "/" + picture.showVendorPicFolderPath + img.vendor_image,
                        alt: img.alt,
                        default: img.default
                    }
                );
            })
        }
        let d = {};
        d.availableInCities = vendor.availableInCities;
        d.categories = vendor.categories;
        d.city = vendor.city;
        d.deal = vendor.deal;
        d.disable = vendor.disable;
        d.eazyvenueRating = vendor.eazyvenueRating;
        d.googleRating = vendor.googleRating;
        d.vendorImage = imagePath;
        d.longDescription = vendor.longDescription;
        d.name = vendor.name;
        d.responseTime = vendor.responseTime;
        if(vendor.categories[0].name === "Photographer"){
            let services = [];
            for(let item of vendor.services){
                let price = item.price;
                if(slot){
                    price = slot === 'fullDayPrice' ? item.fullDayPrice + " for Full Day" : slot === 'hours12Price' ? item.hours12Price + " for 12 Hours" : slot === 'hours8Price' ? item.hours8Price + " for 8 Hours" : slot === 'hours4Price' ? item.hours4Price + " for 4 Hours" : price;
                }
                const ser = {
                    name: item.name,
                    price: price,
                    selected: false
                }
                console.log(item);
                services.push(ser)
            }
            d.services = services;
        }else{
            d.services = vendor.services;
        }
        d.shortDescription = vendor.shortDescription;
        d.state = vendor.state;
        d.status = vendor.status;
        d.subarea = vendor.subarea;
        d.workExperience = vendor.workExperience;
        d.zipcode = vendor.zipcode;
        d.id = vendor._id;
        d.metaDescription = vendor.metaDescription;
        d.metaKeywords = vendor.metaKeywords;
        d.currentViews = vendor.views;
        d.totalPeopleBooked = vendor.peopleBooked;
        d.otherServices = vendor.otherServices;
        response.push(d);
        res.json({ data: response })
    } catch (er) {
        console.log(er, 'err')
        res.status(500).json({ message: er });
    }
})
router.get("/byId", async (req, res) => {
    try {

        const id = req.query.id;
        const vendor = await Vendor.find({ _id: id });
        let response = [];
        vendor.forEach(element => {
            let d = {};
            let imagePath = [];
            if (element.images !== 'undefined' && element.images !== null) {
                element.images.forEach(img => {
                    imagePath.push(
                        {
                            vendor_image_src: frontEnd.picPath + "/" + picture.showVendorPicFolderPath + img.vendor_image,
                            alt: img.alt,
                            default: img.default
                        }
                    );
                })
            }
            d.availableInCities = element.availableInCities;
            d.categories = element.categories;
            d.city = element.city;
            d.deal = element.deal;
            d.disable = element.disable;
            d.eazyvenueRating = element.eazyvenueRating;
            d.googleRating = element.googleRating;
            d.vendorImage = imagePath;
            d.longDescription = element.longDescription;
            d.name = element.name;
            d.responseTime = element.responseTime;
            d.services = element.services;
            d.shortDescription = element.shortDescription;
            d.state = element.state;
            d.status = element.status;
            d.subarea = element.subarea;
            d.workExperience = element.workExperience;
            d.zipcode = element.zipcode;
            d.id = element._id;

            response.push(d);
        });
        res.json({ data: response })

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.get("/vendorServices", async (req, res) => {
    try {
        const category = req.query.category;

        const filter = category && category !== 'undefined' ? { 'categories.name': category } : {};
        const pipeLine = [
            ...(Object.keys(filter).length !== 0 ? [{ $match: filter }] : []),
            { $unwind: '$services' },
            {
                $group: {
                    _id: '$services.name',
                    key: { $first: '$services._id' },
                    name: { $first: '$services.name' }
                }
            }
        ] 
        const services = await Vendor.aggregate(pipeLine);

        return res.status(200).json({ data: services });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err });
    }
});

router.get("/getSubareaByName", async (req, res) => {
    try {
        const subareaName = req.query.subareaname;
        const subarea = await Subarea.aggregate([
            {
                $match: {
                    name: subareaName,
                }
            },
            {
                $lookup: {
                    from: 'cities',
                    localField: "city_id",
                    foreignField: "_id",
                    as: 'city'
                }
            },
            {
                $lookup: {
                    from: 'states',
                    localField: 'city.state_id',
                    foreignField: 'id',
                    as: 'state'
                }
            },
            {
                $unwind: '$state'
            },
            {
                $project: {
                    _id: 0,
                    countryname: "India",
                    disable: '$disable',
                    id: '$_id',
                    mode: 'subarea',
                    name: '$name',
                    statecode: '$state.state_code',
                    statename: '$state.name',
                    status: '$status',
                    updated_at: '$created_at'
                }
            }
        ])
        if (subarea.length > 0) {
            res.status(200).json({ data: subarea[0] });
        } else {
            res.status(404).json({ message: 'Subarea not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})
router.get("/getCityByName", async (req, res) => {
    try {
        const cityName = req.query.cityname;
        const city = await City.aggregate([
            {
                $match: {
                    name: cityName,
                }
            },
            {
                $lookup: {
                    from: 'states',
                    localField: 'state_id',
                    foreignField: 'id',
                    as: 'state'
                }
            },
            {
                $unwind: '$state'
            },
            {
                $project: {
                    _id: 0,
                    countryname: "India",
                    disable: '$disable',
                    id: '$_id',
                    mode: 'city',
                    name: '$name',
                    statecode: '$state_code',
                    statename: '$state.name',
                    status: '$status',
                    updated_at: '$updated_at'
                }
            }
        ])

        if (city.length > 0) {
            res.status(200).json({ data: city[0] });
        } else {
            res.status(404).json({ message: 'City not found' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/vendorsForCompare", async (req, res) => {
    try {
        const ids = req.query.id;
        let filter = {};
        if (ids) {
            filter['_id'] = { $in: ids.map(o => mongoose.Types.ObjectId(o)) };
        }
        await Vendor.find(filter).then(data => {
            let response = [];
            data.forEach(element => {
                const vendor = {
                    id: element._id,
                    name: element.name,
                    location: element.subarea.name + ", " + element.city.name + ", " + element.state.name,
                    vendorType: element.categories[0].name,
                    vendorTypeId: element.categories[0].id,
                    googleRating: element.googleRating,
                    eazyvenueRating: element.eazyvenueRating,
                    vendorServices: element.services,
                    image: frontEnd.picPath + "/" + picture.showVendorPicFolderPath + element.images[0].vendor_image,
                    imageAlt: element.images[0].alt,
                }
                response.push(vendor)
            });
            res.status(200).json({ data: response })
        }).catch(e => {
            res.status(500).json({ message: e.message })
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/minMaxVendorPrice", async (req, res) => {
    try {
        const category = req.query.category;
        let pipeline = [];
        if (category && category !== 'undefined') {
            pipeline.push({
                $match: {
                    'categories.name': category,
                }
            });
        }
        
        pipeline.push({
            $group: {
                _id: null,
                minVendorPrice: {
                    $min: "$minVendorPrice"
                },
                maxVendorPrice: {
                    $max: "$minVendorPrice"
                }
            }
        })
        await Vendor.aggregate(pipeline).then(data =>{
            res.status(200).json({data: data})
        }).catch(err =>{
            res.status(500).json({ message: err.message })    
        })

    } catch (er) {
        res.status(500).json({ message: er.message })
    }
})

router.get("/vendorList", async (req, res) => {
    try {
        const category = req.query.category;
        const services = req.query.services;
        const citycode = req.query.citycode;
        const subareacode = req.query.subareacode;
        const subareaname = req.query.subareaname;
        const cityname = req.query.cityname;
        const minBudget = req.query.minBudget;
        const maxBudget = req.query.maxBudget;
        let pageNumber = req.query.pageNumber || 1;
        let pageSize = req.query.pageSize || 10;
        const skipValue = (pageNumber - 1) * pageSize;
        const sort = req.query.sort;
        let filter = services ? { 'services.name': { $in: services } } : {};
        const vendorType = req.query.vendorType;


        if(category !== undefined && category !== 'undefined'){
            filter['categories'] = {
                '$elemMatch' : { name: category }
            }
        }

        if (Array.isArray(req.query.citycode) && req.query.citycode.length > 0) {
            filter['city.id'] = { $in: req.query.citycode };
        } else if (typeof req.query.citycode === 'string') {
            // console.log();
            filter['city.id'] = mongoose.Types.ObjectId(req.query.citycode);
        }
        if (Array.isArray(req.query.subareacode) && req.query.subareacode.length > 0) {
            filter['subarea.id'] = { $in: req.query.subareacode };
        } else if (typeof req.query.subareacode === 'string') {
            filter['subarea.id'] = mongoose.Types.ObjectId(req.query.subareacode);
        }

        if (cityname) {
            filter['city.name'] = cityname;
        }
        if (subareaname) {
            filter['subarea.name'] = subareaname;
        }

        if (req.query.minBudget && req.query.maxBudget) {
            filter['minVendorPrice'] = {
                $gte: parseInt(req.query.minBudget),
                $lte: parseInt(req.query.maxBudget)
            }
        }


        // console.log(filter);
        // console.log(category);
        // console.log(pageSize);
        // console.log(skipValue);
        // add more like city and sub-area
        // console.log('Query Parameters:', { category, pageNumber, pageSize, skipValue });
        let vendorDataList = [];
        const vendorList = await Vendor.find({
            // categories: { $elemMatch: category === 'undefined' ? {} : { name: category } },
            ...filter,
        })
            .sort(
                sort === 'ratings' ? {
                    googleRating: -1
                } : sort === 'price_low_high' ? {
                    minVendorPrice: 1
                } : sort === 'price_high_low' ? {
                    minVendorPrice: -1
                } : sort === 'popularity' ? {
                    views: -1
                } : {}
            )
            .limit(parseInt(pageSize))
            .skip(skipValue);

        // console.log(sort);
        //  console.log('Returned Data Count:', vendorList.length);
        vendorList.forEach(element => {
            // console.log(element);
            let imagePath = [];
            if (element.images !== 'undefined' && element.images !== null) {
                element.images.forEach(img => {
                    imagePath.push({ vendor_image_src: frontEnd.picPath + "/" + picture.showVendorPicFolderPath + img.vendor_image, alt: img.alt, default: img.default });
                })
            }
            let minVendorPrice = element.minVendorPrice;
            if(!vendorType || category === 'Decorater'){
                minVendorPrice = element.minVendorPrice;
            }
            if(vendorType === "fullDayPrice"){
                minVendorPrice = element.minVendorPrice;
            }
            if(vendorType === "hours12Price"){
                minVendorPrice = element.services.reduce((minPrice, service) => {
                    const price = parseInt(service.hours12Price,10);
                    return Math.min(minPrice, price);
                }, Infinity);
            }
            if(vendorType === "hours8Price"){
                minVendorPrice = element.services.reduce((minPrice, service) => {
                    const price = parseInt(service.hours8Price,10);
                    return Math.min(minPrice, price);
                }, Infinity);
            }
            if(vendorType === "hours4Price"){
                minVendorPrice = element.services.reduce((minPrice, service) => {
                    const price = parseInt(service.hours4Price,10);
                    return Math.min(minPrice, price);
                }, Infinity);
            }
            let data = {
                id: element._id,
                vendorName: element.name,
                subArea: element.subarea.name,
                city: element.city.name,
                googleRating: element.googleRating,
                eazyvenueRating: element.eazyvenueRating,
                packageDeal: element.deal,
                responseTime: element.responseTime,
                workExperience: element.workExperience,
                services: element.services.map(o => ({ 'title': o.name })),
                vendorImage: imagePath,
                selectedStatus: false,
                categories: element.categories,
                // minVendorPrice: element.services.reduce((minPrice, service) => { 
                //     const price = parseInt(service.price.match(/\d+/)[0]);
                //     return Math.min(minPrice, price);
                // }, Infinity),
                status: element.status,
                state: element.state,
                email: element.email,
                minVendorPrice: minVendorPrice,
                metaUrl: element.metaUrl

            }

            vendorDataList.push(data);
        });

        // if(req.query.sort){
        //     if(req.query.sort === 'price_low_high'){
        //         vendorDataList.sort((a, b) => a.minVendorPrice - b.minVendorPrice);
        //     }
        //     if(req.query.sort === 'price_high_low'){
        //         vendorDataList.sort((a, b) => b.minVendorPrice - a.minVendorPrice);
        //     }
        // }
        res.json({ data: vendorDataList });


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
module.exports = router;