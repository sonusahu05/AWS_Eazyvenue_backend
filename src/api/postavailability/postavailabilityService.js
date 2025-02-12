const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const PostavailabilityRepository = require('./postavailabilityRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');
class PostavailabilityService {
    constructor() {
        this.repository = new PostavailabilityRepository();
    }

    addPostavailability(postavailability) {
        //console.log(postavailability);
        return this.repository.findByPostAvailability(postavailability).then((existingPostavailability) => {
            //console.log(existingPostavailability);
            if (existingPostavailability.length > 0) {
                throw new Error('Already exists');
            }
            return this.repository.add(postavailability);
        })
        //return this.repository.add(postavailability);
    }

    checkDuplicate(postavailability) {

        return this.repository.findByPostAvailability(postavailability).then((existingPostavailability) => {
            //console.log(existinglot);
            return existingPostavailability;
        })
    }

    addMany(postavailability) {
        return this.repository.addMany(postavailability);
    }

    findById(id) {
        return this.repository.findById(id)
            .then(postavailability => this.mapPostavailabilityToDto(postavailability[0]));
    }

    updatePostavailability(id, postavailabilityData) {
        return this.repository.edit(id, postavailabilityData).then((postavailability) => {
            return this.findById(id);
        });
    }

    list(filter) {
        return Promise.all([
            this.repository.listFiltered(filter)
        ])
            .then(([data]) => {
                return {
                    totalCount: data.length,
                    items: data.map(item => this.mapPostavailabilityToDto(item))
                };
            });
    }

    mapPostavailabilityToDto(postavailability) {
        //console.log(postavailability.slotdata);
        var createdBy;
        if (postavailability.createduserdata) {
            //createdBy= postavailability.createduserdata[0].firstName+ ' '+postavailability.createduserdata[0].lastName;
        }
        var updatedBy;
        if (postavailability.updateduserdata.length > 0) {
            updatedBy = postavailability.updateduserdata[0].firstName + ' ' + postavailability.updateduserdata[0].lastName;
        }
        var venueName;
        if (postavailability.venuedata.length > 0) {
            venueName = postavailability.venuedata[0].name;
        }
        var slotName;
        if (postavailability.slotdata.length > 0) {
            slotName = postavailability.slotdata[0].slot;
        }
        // var slotTime;
        // var slotStartHours;
        // var slotStartMinutes;
        // var slotEndHours;
        // var slotEndMinutes;
        // if(postavailability.slotdata.length > 0){
        //     slotTime= postavailability.slotdata[0].startTime.hours+':'+postavailability.slotdata[0].startTime.minutes+' - '+postavailability.slotdata[0].endTime.hours+':'+postavailability.slotdata[0].endTime.minutes;
        //     slotStartHours = postavailability.slotdata[0].startTime.hours;
        //     slotStartMinutes = postavailability.slotdata[0].startTime.minutes;
        //     slotEndHours = postavailability.slotdata[0].endTime.hours;
        //     slotEndMinutes = postavailability.slotdata[0].endTime.minutes;
        // }
        // var courseName;
        // if(postavailability.coursedata.length > 0){
        //      courseName= postavailability.coursedata[0].name;
        // }

        return postavailability ? {
            id: postavailability._id,
            slotdate: postavailability.slotdate,
            slotenddate: postavailability.slotenddate, //moment(postavailability.slotdate).format("DD-MM-YYYY"),
            slotday: postavailability.slotday,
            venueId: postavailability.venueId,
            venueName: venueName,
            slot: slotName,
            slotId: postavailability.slotId,
            status: postavailability.status,
            disable: postavailability.disable,
            created_by: postavailability.created_by,
            createdBy: createdBy,
            created_at: postavailability.created_at,
            updated_at: postavailability.updated_at,
            updatedBy: updatedBy,
            updatedby: postavailability.updated_by,
            recurring: postavailability.recurring,
        } : {};
    }
}

module.exports = PostavailabilityService;