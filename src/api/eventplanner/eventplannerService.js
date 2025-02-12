const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const EventplanerRepository = require('./eventplannerRepository');
const cipher = require('../common/auth/cipherHelper');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class EventplanerService {
    constructor() {
        this.repository = new EventplanerRepository();
    }
    add(eventplannerData) {       
        return this.repository.add(eventplannerData);
    }

    findById(id) {
        return this.repository.findById(id)
            .then(eventplanner => this.mapEventplannerToDto(eventplanner[0]));
    }

    update(id, eventplannerData) { 
        return this.repository.edit(id, eventplannerData).then((eventplanner) => {
            return this.findById(id);
        });
    }

    list(filter) {
        return Promise.all([
            this.repository.listFiltered(filter),
            this.repository.getCountFiltered(filter),
            ])
            .then(([data, totalRecords]) => {
                return {
                    totalCount: totalRecords.length,
                    items: data.map(item => this.mapEventplannerToDto(item))                    
                };
            });
    }

   
    
    mapEventplannerToDto(eventplanner) {       
        return eventplanner ? {
            id: eventplanner._id,
            name: eventplanner.name,
            mobileNumber: eventplanner.mobileNumber,
            eventdate: eventplanner.eventdate,
            email: eventplanner.email,
            guestcnt: eventplanner.guestcnt,
            status: eventplanner.status,
            disable: eventplanner.disable,
            created_at: eventplanner.created_at,
            updated_at: eventplanner.updated_at,
        } : {};
    }
}
module.exports = EventplanerService;