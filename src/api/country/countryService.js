const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const CountryRepository = require('./countryRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class CountryService {
    constructor() {
        this.repository = new CountryRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(country => this.mapCountryToDto(country[0]));
    }

    updateCountry(id, countryData) { 
        return this.repository.edit(id, countryData).then((country) => {
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
                    items: data //.map(item => this.mapCountryToDto(item))                    
                };
            });
    }

   
    
    mapCountryToDto(country) {       
        return country ? {
            _id: country._id,
            id: country.id,
            name: country.name,
            code: country.code,
            status: country.status,
            disable: country.disable,
            created_at: country.created_at,
            updated_at: country.updated_at,
        } : {};
    }
}
module.exports = CountryService;