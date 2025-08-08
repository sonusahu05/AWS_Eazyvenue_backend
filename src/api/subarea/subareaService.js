const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const SubareaRepository = require('./subareaRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class SubareaService {
    constructor() {
        this.repository = new SubareaRepository();
    }

    addSubArea(subarea) {
        return this.repository.findByName(subarea.name).then((existingUser) => {
        
          if (existingUser) {
              throw new Error('Sub Area already exists');
          } else {
            return this.repository.add(subarea);
          }
        })
      }

    findById(id) {
        return this.repository.findById(id)
            .then(data => this.mapSubareaToDto(data[0]));
    }

    findBySubAreaName(name){
        return this.repository.findBySubareaName(name);
    }

    update(id, updateData) { 
        return this.repository.edit(id, updateData).then((data) => {
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
                    items: data.map(item => this.mapSubareaToDto(item))                    
                };
            });
    }   
    
    mapSubareaToDto(subarea) {   
        var countryname;
        var countrycode;
        // if(subarea.countrydata.length > 0) {
        //     countryname= subarea.countrydata[0]['name'];
        //     countrycode= subarea.countrydata[0]['code'];
        // }  
        var statename;
        var statecode;
        if(subarea.statedata.length > 0) {
            statename= subarea.statedata[0]['name'];
            statecode= subarea.statedata[0]['state_code'];
        }    
        var cityname;
        if(subarea.citydata.length > 0) {
            cityname= subarea.citydata[0]['name'];
        }  
        return subarea ? {
            id: subarea._id,
            name: subarea.name,
            cityname: cityname,
            // countrycode: countrycode,
            statename: statename,
            state_id: statecode,
            status: subarea.status,
            disable: subarea.disable,
            created_at: subarea.created_at,
            updated_at: subarea.updated_at,
        } : {};
    }
}
module.exports = SubareaService;