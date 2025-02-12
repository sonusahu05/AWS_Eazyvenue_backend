const router = require("express").Router();
const Slot = require("../../../model/Slot");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const SlotService = require('./slotService');
const { picture } = require('config');
const slotService = new SlotService();
const uuidv1 = require('uuid');
const { ObjectID } = require('mongodb');
var moment = require('moment');
// const Moment = require('moment');
// const MomentRange = require('moment-range');
// const moment = MomentRange.extendMoment(Moment);
router.post('/', auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const slotObj = new Slot({
            slot: req.body.slot,
            description: req.body.description,
            status: req.body.status,
            disable: false,
            created_by: userId,
        });
        const savedSlot = await slotObj.save();
        res.send(savedSlot);
        // slotService
        //     .addSlot(slotObj)
        //     .then(slot => {
        //         res.json({ message: "Data Inserted Successfully", id: slot.insertedId });
        //     })
        //     .catch(err => res.status(400).send({ error: err.message }));
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});
// Get All Content Listing
router.get("/", auth, async (req, res) => {
    try {
        slotService
            .list(req.query)
            .then(slots => {
                res.json({ totalCount: slots.length, data: slots });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get All Content Listing
router.get("/v1", async (req, res) => {
    try {
        slotService
            .list(req.query)
            .then(slots => {
                res.json({ totalCount: slots.length, data: slots });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single Content Listing
router.get("/:slotId", auth, async (req, res) => {
    try {
        const slot = await slotService.findById(req.params.slotId);
        res.json(slot);
    } catch (error) {
        res.json({ message: error });
    }
});
// Update Content
router.put("/:slotId", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const slotObj = [];
        slotObj['updated_by'] = ObjectID(userId);
        slotObj['updated_at'] = moment.utc().toDate();
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                slotObj['disable'] = req.body[key];
                slotObj['deleted_by'] = ObjectID(userId);
                slotObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                slotObj['status'] = req.body[key];
            } else {
                slotObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, slotObj);
        const updatedSlot = await slotService.updateSlot(req.params.slotId, updateData);
        res.json({ message: "Data Updated Successfully", data: updatedSlot });
    } catch (error) {
        res.json({ message: error });
    }
});
//Delet Content
router.delete("/:slotId", auth, async (req, res) => {
    try {
        const removeSlot = await slotService.findByIdAndDelete(req.params.slotId);
        res.json({ message: "Data Deleted Successfully" });
    } catch (error) {
        res.json({ message: error });
    }
});
module.exports = router;