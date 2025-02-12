const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const CityRepository = require('./cityRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class CityService {
    constructor() {
        this.repository = new CityRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(contactUs => this.mapCityToDto(contactUs[0]));
    }
    findCityByName(name){
        return this.repository.findByCityName(name);   
    }
    findCityByCityNameList(nameList){
        return this.repository.findByCityList(nameList);   
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
                    items: data.map(item => this.mapCityToDto(item))                    
                };
            });
    }   
    
    mapCityToDto(city) {   
        var countryname;
        var countrycode;
        if(city.countrydata.length > 0) {
            countryname= city.countrydata[0]['name'];
            countrycode= city.countrydata[0]['code'];
        }  
        var statename;
        var statecode;
        if(city.statedata.length > 0) {
            statename= city.statedata[0]['name'];
            statecode= city.statedata[0]['state_code'];
        }    
        return city ? {
            id: city._id,
            name: city.name,
            countryname: countryname,
            countrycode: countrycode,
            statename: statename,
            statecode: statecode,
            status: city.status,
            disable: city.disable,
            created_at: city.created_at,
            updated_at: city.updated_at,
        } : {};
    }
}
module.exports = CityService;