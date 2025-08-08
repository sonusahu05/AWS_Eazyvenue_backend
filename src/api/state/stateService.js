const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const StateRepository = require('./stateRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class StateService {
    constructor() {
        this.repository = new StateRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(state => this.mapStateToDto(state[0]));
    }

    updateState(id, stateData) { 
        return this.repository.edit(id, stateData).then((state) => {
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
                    items: data //.map(item => this.mapStateToDto(item))                    
                };
            });
    }

   
    
    mapStateToDto(state) {     
        return state ? {
            id: state._id,
            name: state.name,
            state_code: state.state_code,
            country_id: state.country_id,
            status: state.status,
            disable: state.disable,
            created_at: state.created_at,
            updated_at: state.updated_at,
        } : {};
    }
}
module.exports = StateService;