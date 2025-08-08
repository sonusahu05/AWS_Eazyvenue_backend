const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const ContactUsRepository = require('./contactUsRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class ContactUsService {
    constructor() {
        this.repository = new ContactUsRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(contactUs => this.mapContactUsToDto(contactUs[0]));
    }

    updateContactUs(id, contactUsData) { console.log(contactUsData);
        return this.repository.edit(id, contactUsData).then((contactUs) => {
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
                    items: data //.map(item => this.mapContactUsToDto(item))                    
                };
            });
    }

   
    
    mapContactUsToDto(contactUs) {       
        return contactUs ? {
            id: contactUs._id,
            name: contactUs.name,
            phoneNumber: contactUs.phoneNumber,
            message: contactUs.message,
            email: contactUs.email,
            status: contactUs.status,
            disable: contactUs.disable,
            created_at: contactUs.created_at,
            updated_at: contactUs.updated_at,
        } : {};
    }
}
module.exports = ContactUsService;