const Offer = require("../../../model/Offer");
const OfferService = require("./offerService");
const offerService = new OfferService();
const OfferRepository = require('./offerRepository');
const offerRepository = new OfferRepository();
const router = require("express").Router();
const cipher = require('../common/auth/cipherHelper');
const { ObjectID } = require('mongodb');
const mongoose = require('mongoose');
var moment = require('moment');
const uuidv1 = require('uuid');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const { picture} = require('config');


router.post('/', auth, async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const { name } = req.body;
    const existingOffer = await offerRepository.findByOfferName(name)

    if (existingOffer) {
        res.status(404).send({ message: 'Offer Already Exists' });
    } else {
        var offerImagefilename = [];

        if (typeof req.body.offerImage != 'undefined' && req.body.offerImage != "") {
            req.body.offerImage.forEach(element => {
                const offerImageData = element.file;
                const fileType = offerImageData.match(/[^:/]\w+(?=;|,)/)[0];
                offerFile = uuidv1() + "." + fileType;
                offerImagefilename.push({ offer_image_src: offerFile, alt: element.alt, default: element.default });
                offerPath = picture.offerPicFolder + offerFile;
                let offerfilename;
                offerfilename = __dirname + "/../../../" + offerPath;

                var base64Data;
                if (offerImageData.indexOf("data:image/png;") !== -1) {
                    base64Data = offerImageData.replace(/^data:image\/png;base64,/, "");
                } else if (offerImageData.indexOf("data:image/jpg;") !== -1) {
                    base64Data = offerImageData.replace(/^data:image\/jpg;base64,/, "");
                } else if (offerImageData.indexOf("data:image/jpeg") !== -1) {
                    base64Data = offerImageData.replace(/^data:image\/jpeg;base64,/, "");
                } else if (offerImageData.indexOf("data:image/svg") !== -1) {
                    base64Data = offerImageData.replace(/^data:image\/svg;base64,/, "");
                }

                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg,svg files are allowed!!" });
                } else if (base64Data != "") {

                    require("fs").writeFile(offerfilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                }
            });
        }

        var assign_offer_to = req.body.assign_offer_to;
        var assign_offer_to_arr = [];
        assign_offer_to.forEach((element) => {

            const objectId = mongoose.Types.ObjectId(element);
            assign_offer_to_arr.push({ id: objectId });

        })

        var occasion = req.body.occasion;
        var occasionarr = [];
        occasion.forEach((element) => {

            const objectId = mongoose.Types.ObjectId(element);
            occasionarr.push({ id: objectId });

        })


        var city = req.body.city;
        var cityarr = [];
        city.forEach((element) => {

            const objectId = mongoose.Types.ObjectId(element);
            cityarr.push({ id: objectId });


        })

        var subarea = req.body.subarea;
        var subareaarr = [];
        subarea.forEach((element) => {

            const objectId = mongoose.Types.ObjectId(element);
            subareaarr.push({ id: objectId });


        })


        var venues = req.body.venue;
        var venuearr = [];
        venues.forEach((element) => {

            const objectId = mongoose.Types.ObjectId(element);
            venuearr.push({ id: objectId });


        })

        const offerObj = new Offer({
            name: req.body.name,
            title: req.body.title,
            description: req.body.description,
            offer_type: req.body.offer_type,
            code: req.body.code,
            is_amount: req.body.is_amount,
            discount_percentage: req.body.discount_percentage,
            discount_amount: req.body.discount_amount,
            mimimum_amount: req.body.mimimum_amount,
            offer_valid_from: req.body.offer_valid_from,
            offer_valid_to: req.body.offer_valid_to,
            offer_allocation: req.body.offer_allocation,
            assign_offer_to: assign_offer_to_arr,
            occasion: occasionarr,
            city: cityarr,
            subarea: subareaarr,
            venue: venuearr,
            promo_display_type: req.body.promo_display_type,
            offerImage: offerImagefilename,
            status: req.body.status,
            disable: false,
            created_by: userId
        })
        try {
            const savedOffer = await offerObj.save();
            res.send(savedOffer);
        } catch (error) {
            res.status(404).send(error);
        }
    }

});

router.get("/",auth, async (req, res) => {
    try {
        offerService
            .list(req.query, false)
            .then(offer => {
                res.json({ totalCount: offer.length, data: offer });
            })
    } catch (error) {
        res.json({ message: error });
    }
});


router.get("/:id",auth, async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        res.json(offer);
    } catch (error) {
        res.json({ message: error });
    }
});


router.put("/:id",auth, async (req, res) => {
    const userId = cipher.getUserFromToken(req);
    const offerObj = [];
    const offerId = req.params.id;
    offerObj['updated_by'] = ObjectID(userId);
    offerObj['updated_at'] = moment.utc().toDate();
    for (var key in req.body) {
        if (key == "disable") {
            offerObj['disable'] = req.body.disable;
            offerObj['deleted_by'] = ObjectID(userId);
            offerObj['deleted_at'] = moment.utc().toDate();
        } else if (key == "status") {
            offerObj['status'] = req.body[key];
        } else {
            offerObj[key] = req.body[key];
        }
    }
    const updateData = Object.assign({}, offerObj);
    await offerService.updateOffer(offerId, updateData).then(offerData => {
        res.json({ message: "Data Updated Successfully", data: offerData });
    });
});

module.exports = router;