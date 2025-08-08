const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const UserRepository = require('./userRepository');
const SettingService = require('../common/settings/settingsService');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const settingService = new SettingService();
const { api, frontEnd, picture } = require('config');
var moment = require('moment');
class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  getCount() {
    return this.repository.getCount();
  }

  findByEmail(email) {
    return this.repository.findByEmail(email);
  }

  findByMobleNumber(mobileNumber){
    return this.repository.findByMobileNumber(mobileNumber);
  }

  finddetailById(id) {
    return this.repository.findById(id);
  }

  findById(id) {
    return this.repository.findById(id)
      .then(user => this.mapDefaultUserToDto(user));
  }

  addUser(user) {
    return this.repository.findByEmail(user.email).then((existingUser) => {
      if (existingUser) {
        if (existingUser.disable == true) {
          return this.repository.add(user);
        } else {
          user.insertedId = existingUser._id;
          return user;
          // throw new Error('User already exists');
        }
      } else {
        return this.repository.add(user);
      }
    })
  }

  addMany(users) {
    return this.repository.addMany(users);
  }

  updateUser(id, userData) {
    //console.log(userData);
    return this.repository.edit(id, userData).then((user) => {
      return this.findById(id);
    });
  }

  editUser(dto, userId) {
    const user = this.mapDtoToUser(dto);

    return this.repository.findAllUsersByEmail(user.email)
      .then((users) => {
        if (this._isDuplicateEmail(users, userId)) {
          const errorData = {
            error: {
              code: 409,
              field: 'email',
              type: 'exist',
            },
          };

          throw new CustomErrorService('Email error', errorData);
        }

        return this.repository.edit(userId, user);
      })
      .then(() => this.findById(userId))
      .catch(error => {
        throw error;
      });
  }

  editCurrentUser(dto, userId) {
    return this.editUser(dto, userId)
      .then(user => {
        return cipher.generateResponseTokens(user);
      })
      .catch(error => {
        throw error;
      });
  }

  deleteUser(id) {
    return this.repository.delete(id);
  }

  changePassword(id, salt, passwordHash) {
    return this.repository.changePassword(id, salt, passwordHash);
  }

  getPhoto(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, config.get('auth.jwt.accessTokenSecret'));
    } catch (err) {
      Promise.reject(new Error('invalid token'));
    }

    return this.repository.getPhoto(decoded.id);
  }

  list(filter) {
    return Promise.all([
      this.repository.listFiltered(filter),
      this.repository.getCountFiltered(filter),
    ])
      .then(([data, totalRecords]) => {
        return {
          totalCount: data.length,
          items: data.map(item => this.mapDefaultUserToDto(item)),
        };
      });
  }

  getPhotoUrl(photoName) {
    if (typeof photoName !== 'undefined' && photoName !== null) {
      var profilePic = picture.profilePicFolder + photoName;
      if (fs.existsSync(profilePic)) {
        return frontEnd.picPath  + "/" + picture.showPicFolderPath + photoName;
      } else {
        return frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'profile.jpg';
      }
    } else {
      return frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'profile.jpg';
    }
  }
  getPortfolioImageUrl(imageNames) {
    if (typeof imageNames !== 'undefined' && imageNames !== null) {
        var imagePath = [];
        imageNames.forEach(element => {
            var venueImage = picture.portfolioPicFolder + element.venue_image_src;
            if (fs.existsSync(venueImage)) {
                imagePath.push({ venue_image_src: frontEnd.picPath  + "/" + picture.showPortfolioPicFolderPath + element.venue_image_src, alt: element.alt, default: element.default });
            } else {
                imagePath.push(frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
            }

        })
        return imagePath;
    } else {
        return frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
    }
}

  mapDefaultUserToDto(user) {
    var createdBy;
    var updatedBy;
    if(user.createduserdata != undefined) {
      if (user.createduserdata.length > 0) {
        createdBy = user.createduserdata[0].firstName + ' ' + user.createduserdata[0].lastName;
      }
      if (user.updateduserdata.length > 0) {
        updatedBy = user.updateduserdata[0].firstName + ' ' + user.updateduserdata[0].lastName;
      }
    }
   
    
   
    var dob = "";
    if (typeof user.dob != 'undefined') {
      dob = moment(user.dob).format("DD-MM-YYYY");
      //dob = user.dob;
    }
    return user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      mobileNumber: user.mobileNumber,
      fullName: user.firstName + ' ' + user.lastName,
      address: user.address,
      countryname: user.countryname,
      countrycode: user.countrycode,
      statename: user.statename,
      statecode: user.statecode,
      cityname: user.cityname,
      citycode: user.citycode,
      zipcode: user.zipcode,
      gender: user.gender,
      dob: dob,
      profilepic: this.getPhotoUrl(user.profilepic),
      portfolioImages : this.getPortfolioImageUrl(user.portfolioImage),
      category: user.category,
      status: user.status,
      disable: user.disable,
      timeZone: user.timeZone,
      timeZoneOffset: user.timeZoneOffset,
      created_at: user.created_at,
      updated_at: user.updated_at,
      createdby: user.created_by,
      createdBy: createdBy,
      updatedby: user.updated_by,
      updatedBy: updatedBy,
    } : {};
  }


  _isDuplicateEmail(users, userId) {
    if (users && users.length === 0) {
      return false;
    }

    if (users.length > 1) {
      return true;
    }

    return users.some(user => user._id.toString() !== userId.toString());
  }
}

module.exports = UserService;