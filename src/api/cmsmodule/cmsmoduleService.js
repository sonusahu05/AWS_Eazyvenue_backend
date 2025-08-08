const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const CmsmoduleRepository = require('./cmsmoduleRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class CmsmoduleService {
    constructor() {
        this.repository = new CmsmoduleRepository();
    }

    addCmsModule(module) {
        //return this.repository.add(module);
        //console.log(module.module);
        return this.repository.findByCmsSlug(module.slug).then((existingModule) => {
            if (existingModule) {
                throw new Error('CMSModule already exists');
            }
            return this.repository.add(module);
        })
    }  
    
    findById(id) {        
        return this.repository.findById(id)
            .then(cms => this.mapCmsToDto(cms[0]));
    }

    list(filter) {
        return Promise.all([
            this.repository.listFiltered(filter),
            this.repository.getCountFiltered(filter),
            ])
            .then(([data, totalRecords]) => {
                return {
                    totalCount: totalRecords.length,
                    items: data //.map(item => this.mapCmsToDto(item))                    
                };
            });
    }

    update(id, updateData) {
        return this.repository.edit(id, updateData).then((user) => {
          return this.findById(id);
        });
      }

    getImageUrl(imgName) {
        if (typeof imgName !== 'undefined' && imgName !== null && imgName !="") {
            var profilePic = picture.cmsPicFolder + imgName;
            if (fs.existsSync(profilePic)) {
                return frontEnd.picPath  + "/" + picture.showCmsPicFolderPath + imgName;
            } 
        }
    }
    
    mapCmsToDto(cms) {       
        var createdBy;
        if(cms.createduserdata){
            createdBy= cms.createduserdata[0].firstName+ ' '+cms.createduserdata[0].lastName;
        }
        var updatedBy;
        if(cms.updateduserdata.length > 0){
            updatedBy= cms.updateduserdata[0].firstName+ ' '+cms.updateduserdata[0].lastName;
        }     
        return cms ? {
            id: cms._id,
            cmsTitle: cms.cmsTitle,    
            cmspageTitle: cms.cmspageTitle,
            slug: cms.slug,
            cmsContent: cms.cmsContent,
            cmsDescription: cms.cmsDescription,            
            metaKeyword: cms.metaKeyword,
            metaDescription: cms.metaDescription,
            cmsImage: this.getImageUrl(cms.cmsImage),
            status: cms.status,
            disable: cms.disable,
            created_by: cms.created_by,
            createdBy: createdBy, 
            created_at: cms.created_at,
            updated_at: cms.updated_at,
            updatedBy: updatedBy,            
            updatedby: cms.updated_by
        } : {};
    }
}
module.exports = CmsmoduleService;