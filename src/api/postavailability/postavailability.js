const router = require("express").Router();
const PostAvailability = require("../../../model/PostAvailability");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const PostavailabilityService = require('./postavailabilityService');
const { picture } = require('config');
const postavailabilityService = new PostavailabilityService();
const uuidv1 = require('uuid');
const { ObjectID, ObjectId } = require('mongodb');
var moment = require('moment');
const Venue = require('../../../model/Venue')
//var momentweek = require('moment-weekdaysin');
//Note for developer: saving slotdate in UTC...accepting startdate/enddate and slotdate in DD-MM-YYYY

// router.get('/addAll', async (req, res) => {
//   try {
//     const venueList = await Venue.find({});

//     for (const venue of venueList) {
//         const vId = venue._id;
//         const startDate = new Date('2023-11-01T00:00:00.000Z');
//         const endDate = new Date('2023-11-30T00:00:00.000Z');

//         let currentDate = new Date(startDate);
//         while (currentDate <= endDate) {
//             const venueSlots = [];
//             const dayOfWeek = currentDate.getDay();
//             const dayOfWeekString = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

//             for (let w = 0; w < 3; w++) {
//             const postAvailability = {
//                 slotdate: currentDate,
//                 slotenddate: currentDate,
//                 slotday: dayOfWeekString,
//                 venueId: vId,
//                 slotId: w === 0 ? ObjectId('655b060b47c5cd1257b70bf1') : w === 1 ? ObjectId('655b060b47c5cd1257b70bf2') : ObjectId('655b060b47c5cd1257b70bf3'),
//                 recurring: true,
//                 status: true,
//                 disable: false,
//                 created_by: ObjectId('655b060b47c5cd1257b70be8'),
//                 updated_by: ObjectId('655b060b47c5cd1257b70be8')
//             };
//             venueSlots.push(postAvailability);
//             }
//             await postavailabilityService.addMany(venueSlots);
//             currentDate.setDate(currentDate.getDate() + 1);
//         }
//     }

//     res.json({ message: 'Done' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


router.post('/', auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        //var startDate = moment(req.body.startDate, "DD-MM-YYYY").utc().toDate();
        var startDate = moment.parseZone(req.body.startDate).utc().format();
        //var endDate = moment(req.body.endDate, "DD-MM-YYYY").utc().toDate();
        var endDate = moment.parseZone(req.body.endDate).utc().format();
        var slotData = req.body.slotData;
        const postavailabilityArr = [];
        const duplicatePostavailability = [];
        const savepostavailabilityArr = [];
        if (req.body.recurring == true) {
            for (var m = moment(startDate); m.isSameOrBefore(endDate); m.add(1, 'days')) {
                slotData.forEach((slot) => {
                    currentDay = m.format('dddd');
                    if (slot.slotday == currentDay) {
                        var tmpslot = slot.slot;
                        var slotdata = tmpslot.split(" - ");
                        var startTime = slotdata[0].split(":");
                        var stdt = new Date(m);
                        // stdt.setHours(startTime[0]);
                        // stdt.setMinutes(startTime[1]);
                        //var endTime = slotdata[1].split(":");
                        var eddt = new Date(m);
                        // eddt.setHours(endTime[0]);
                        // eddt.setMinutes(endTime[1]);
                        //    // var sessionenddate = moment.tz(moment(livesessionenddate).format('YYYY-MM-DD HH:mm'), 'YYYY-MM-DD HH:mm Z',this.timeZone);
                        //     var endTime = sloddata.slot[1].split(":");
                        var postavailabilityObj = new PostAvailability({
                            slotdate: moment(stdt).utc(),//m.toDate(),
                            slotenddate: moment(eddt).utc(),
                            slotday: slot.slotday,
                            venueId: ObjectID(req.body.venueId),
                            status: slot.status,
                            disable: slot.disable,
                            slotId: ObjectID(slot.slotId),
                            created_by: userId,
                            updated_by: ObjectID(userId),
                            recurring: true
                        });
                        postavailabilityArr.push(postavailabilityObj);
                    }
                });
            }
            if (postavailabilityArr.length > 0) {
                for (i = 0; i < postavailabilityArr.length; i++) {
                    duplicate = await postavailabilityService.checkDuplicate(postavailabilityArr[i]);
                    if (duplicate.length > 0) {
                        duplicatePostavailability.push(duplicate);
                    } else {
                        savepostavailabilityArr.push(postavailabilityArr[i]);
                    }
                }
                if (savepostavailabilityArr.length > 0) {
                    postavailabilityService
                        .addMany(savepostavailabilityArr)
                        .then(postavailability => {
                            res.json({ message: "Data Inserted Successfully", "duplicatePostavailability": duplicatePostavailability });
                        })
                        .catch(err => res.status(400).send({ error: err.message }));
                } else {
                    res.json({ message: "Already exist", "duplicatePostavailability": duplicatePostavailability });
                }
            }
        } else {
            //add individual postavailability record
            const slotdate = moment(req.body.slotdate, 'DD-MM-YYYY');
            var startDate = moment.parseZone(req.body.startDate).utc().format();
            const slotday = slotdate.format('dddd');
            var slot = req.body.slotdata;
            var tmpslot = slot.slot;
            var slotdata = tmpslot.split(" - ");
            //var startTime = slotdata[0].split(":");
            var stdt = new Date(startDate);
            // stdt.setHours(startTime[0]);
            // stdt.setMinutes(startTime[1]);
            // var endTime = slotdata[1].split(":");
            var eddt = new Date(startDate);
            // eddt.setHours(endTime[0]);
            // eddt.setMinutes(endTime[1]);
            const postavailabilityObj = new PostAvailability({
                // slotdate: slotdate.utc().toDate(),
                slotday: slotday,
                slotdate: moment(stdt).utc(),//m.toDate(),
                slotenddate: moment(eddt).utc(),
                venueId: ObjectID(req.body.venueId),
                slotId: ObjectID(req.body.slotId),
                status: slot.status,
                disable: slot.disable,
                created_by: userId,
                updated_by: ObjectID(userId),
                disable: req.body.disable,
                recurring: false,
            });
            postavailabilityService
                .addPostavailability(postavailabilityObj)
                .then(postavailability => {
                    res.json({ message: "Data Inserted Successfully", id: postavailability.insertedId });
                })
                .catch(err => res.status(400).send({ error: err.message }));
        }
    } catch (error) {
        res.json({ message: error });
    }
});
// Get All Content Listing
router.get("/", auth, async (req, res) => {
    try {
        postavailabilityService
            .list(req.query)
            .then(postavailability => {
                res.json({ totalCount: postavailability.length, data: postavailability });
            })
    } catch (error) {
        console.log(error,'errir')
        res.json({ message: error });
    }
});
// Get All Content Listing without Auth.
router.get("/v1", async (req, res) => {
    try {
        postavailabilityService
            .list(req.query)
            .then(postavailability => {
                res.json({ totalCount: postavailability.length, data: postavailability });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get Single Content Listing
router.get("/:postavailabilityId", auth, async (req, res) => {
    try {
        const postavailability = await postavailabilityService.findById(req.params.postavailabilityId);
        res.json(postavailability);
    } catch (error) {
        res.json({ message: error });
    }
});
// Update Content
router.put("/:postavailabilityId", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const postavailabilityObj = [];
        postavailabilityObj['updated_by'] = ObjectID(userId);
        postavailabilityObj['updated_at'] = moment.utc().toDate();
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                postavailabilityObj['disable'] = req.body[key];
                postavailabilityObj['deleted_by'] = ObjectID(userId);
                postavailabilityObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "venueId") {
                postavailabilityObj['venueId'] = ObjectID(req.body.venueId);
            } else if (key == "roleId") {
                postavailabilityObj['roleId'] = ObjectID(req.body.roleId);
            } else if (key == "slotId") {
                postavailabilityObj['slotId'] = ObjectID(req.body.slotId);
            } else if (key == "status") {
                postavailabilityObj['status'] = req.body[key];
            } else {
                postavailabilityObj[key] = req.body[key];
            }
        }
        const updateData = Object.assign({}, postavailabilityObj);
        const updatedPostavailability = await postavailabilityService.updatePostavailability(req.params.postavailabilityId, updateData);
        res.json({ message: "Data Updated Successfully", data: updatedPostavailability });
    } catch (error) {
        res.json({ message: error });
    }
});
//Delet Content
router.delete("/:postavailabilityId", auth, async (req, res) => {
    try {
        const removeLesson = await postavailabilityService.findByIdAndDelete(req.params.postavailabilityId);
        res.json({ message: "Data Deleted Successfully" });
    } catch (error) {
        res.json({ message: error });
    }
});
module.exports = router;