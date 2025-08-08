const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const SlotRepository = require('./slotRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');
class SlotService {
    constructor() {
        this.repository = new SlotRepository();
    }

    addSlot(slot) {
        return this.repository.findBySlot(slot.slot).then((existingSlot) => {
            console.log('existingSlot', existingSlot);
            if (existingSlot.length > 0) {
                throw new Error('Slot already exists');
            } else {
                return this.repository.add(slot);
            }
        })
        //return this.repository.add(slot);
    }

    addMany(slots) {
        return this.repository.addMany(slots);
    }

    checkDuplicate(slot) {
        return this.repository.findByslotByTrainer(slot).then((existinglot) => {
            //console.log(existinglot);
            return existinglot;
        })
    }
    findById(id) {
        return this.repository.findById(id)
            .then(slot => this.mapSlotToDto(slot[0]));
    }

    updateSlot(id, slotData) {
        return this.repository.edit(id, slotData).then((slot) => {
            //console.log(id);
            return this.findById(id);
        });
    }

    list(filter) {
        return Promise.all([
            this.repository.listFiltered(filter),
            this.repository.getCountFiltered(filter),
        ])
            .then(([data, totalCount]) => {
                return {
                    totalCount: totalCount.length,
                    items: data.map(item => this.mapSlotToDto(item))
                };
            });
    }

    mapSlotToDto(slot) {
        var createdBy;
        if (slot.createduserdata) {
            createdBy = slot.createduserdata[0].firstName + ' ' + slot.createduserdata[0].lastName;
        }
        var updatedBy;
        if (slot.updateduserdata.length > 0) {
            updatedBy = slot.updateduserdata[0].firstName + ' ' + slot.updateduserdata[0].lastName;
        }
        var enduserName;
        if (slot.enduserdata.length > 0) {
            enduserName = slot.enduserdata[0].firstName + ' ' + slot.enduserdata[0].lastName;
        }
        return slot ? {
            id: slot._id,
            slot: slot.slot,
            description: slot.description,
            status: slot.status,
            disable: slot.disable,
            created_by: slot.created_by,
            createdBy: createdBy,
            created_at: slot.created_at,
            updated_at: slot.updated_at,
            updatedBy: updatedBy,
            updatedby: slot.updated_by,
        } : {};
    }
}

module.exports = SlotService;