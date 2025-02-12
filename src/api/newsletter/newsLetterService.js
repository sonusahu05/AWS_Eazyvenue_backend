const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const NewsLetterRepository = require('./newsLetterRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class NewsLetterService {
    constructor() {
        this.repository = new NewsLetterRepository();
    }

    findById(id) {
        return this.repository.findById(id)
            .then(newsLetter => this.mapNewsLetterToDto(newsLetter[0]));
    }

    updateNewsLetter(id, newsLetterData) {
        return this.repository.edit(id, newsLetterData).then((newsLetter) => {
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
                    items: data //.map(item => this.mapNewsLetterToDto(item))                    
                };
            });
    }

   
    
    mapNewsLetterToDto(newsLetter) {       
          
        return newsLetter ? {
            id: newsLetter._id,
            firstName: newsLetter.firstName,
            lastName: newsLetter.lastName,
            fullName: newsLetter.fullName,
            email: newsLetter.email,
            status: newsLetter.status,
            disable: newsLetter.disable,
            created_at: newsLetter.created_at,
            updated_at: newsLetter.updated_at,
        } : {};
    }
}
module.exports = NewsLetterService;