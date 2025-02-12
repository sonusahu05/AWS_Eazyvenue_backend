const jwt = require('jsonwebtoken');
const config = require('config');

const UserroleRepository = require('./userroleRepository');
const SettingService = require('../common/settings/settingsService');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const settingService = new SettingService();
var moment = require('moment');
class UserroleService {
    constructor() {
        this.repository = new UserroleRepository();
    }

    findByRoleName(userrole) {
        return this.repository.findByRoleName(userrole).then(userrole => { return userrole;});
    }
    
    addRole(userrole) {
        return this.repository.findByRoleName(userrole.user_role_name).then((existingUser) => {
            if (existingUser) {
                throw new Error('User Role already exists');
            }
            return this.repository.add(userrole);
        })
    }  

    findById(id) {
        return this.repository.findById(id)
            .then(userrole => this.mapUserroleToDto(userrole[0]));
    }

    updateUserRole(id, userData) {
        return this.repository.edit(id, userData).then((userrole) => {
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
                    items: data.map(item => this.mapUserroleToDto(item))                    
                };
            });
    }
    
    mapUserroleToDto(userrole) {
        var createdBy;
        if(userrole.createduserdata){
            createdBy= userrole.createduserdata[0].firstName+ ' '+userrole.createduserdata[0].lastName;
        }
        var updatedBy;
        if(userrole.updateduserdata.length > 0){
            updatedBy= userrole.updateduserdata[0].firstName+ ' '+userrole.updateduserdata[0].lastName;
        }
        return userrole ? {
            id: userrole._id,
            user_role_name: userrole.user_role_name,
            user_role_description: userrole.user_role_description,
            status: userrole.status,
            icon:userrole.icon,
            url:userrole.url,
            permissions: userrole.permissions,
            default_data:userrole.default_data,
            disable:userrole.disable,
            created_by: userrole.created_by,
            created_at: userrole.created_at,
            updated_at: userrole.updated_at,
            createdby: userrole.created_by,     
            createdBy: createdBy, 
            updatedby: userrole.updated_by,
            updatedBy: updatedBy
        } : {};
        }
}

module.exports = UserroleService;