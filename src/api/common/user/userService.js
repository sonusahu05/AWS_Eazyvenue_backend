const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const UserRepository = require('./userRepository');
const SettingService = require('../settings/settingsService');
const cipher = require('../auth/cipherHelper');
const CustomErrorService = require('../../../utils/customErrorService');
var moment = require('moment');
const settingService = new SettingService();
const { api, frontEnd, picture } = require('config');
class UserService {
  constructor() {
    this.repository = new UserRepository();
  }

  getCount() {
    return this.repository.getCount();
  }

  findByEmail(email) {
    return this.repository.findByEmail(email)
      .then(user => {
        user.profilepic = this.getPhotoUrl(user.profilepic);
        return user;
        //profilepic: this.getPhotoUrl(user.profilepic),
      });
  }

  
  findByMobile(mobile) {
    return this.repository.findByMobile(mobile)
      .then(user => {
        user.profilepic = this.getPhotoUrl(user.profilepic);
        return user;
        //profilepic: this.getPhotoUrl(user.profilepic),
      });
  }

  getPhotoUrl(photoName) {
    if (typeof photoName !== 'undefined' && photoName !== null) {
      var profilePic = picture.profilePicFolder + photoName;
      if (fs.existsSync(profilePic)) {
        return frontEnd.picPath + api.port + "/" + picture.showPicFolderPath + photoName;
      } else {
        return frontEnd.picPath + api.port + "/" + picture.defaultPicFolderPath + 'profile.jpg';
      }
    } else {
      return frontEnd.picPath + api.port + "/" + picture.defaultPicFolderPath + 'profile.jpg';
    }
  }

  
  updateUser(id, userData) {
    //console.log(userData);
    return this.repository.edit(id, userData).then((user) => {
      return this.findById(id);
    });
  }

  getVenueOwner(id) {
    return this.repository.getVenueOwnerDetails(id).then(user => {
      user.profilepic = this.getPhotoUrl(user.profilepic);
      return user;
    });
  }

  findById(id) {
    return this.repository.findById(id)
      .then(user => this.mapUserToDto(user));
  }

  addUser(user) {
    return this.repository.findByEmail(user.email).then((existingUser) => {
      if (existingUser.length > 0) {
        throw new Error('User already exists');
      }
      return this.repository.add(user);
    })
  }

  addMany(users) {
    return this.repository.addMany(users).then((users) => {
      this.findByEmail('admin@admin.admin')
        .then(user => {
          const userObj = [];
          const userId = user._id;
          userObj['created_by'] = userId;
          userObj['updated_by'] = userId;
          userObj['updated_at'] = moment.utc().toDate();
          const updateData = Object.assign({}, userObj);
          this.repository.edit(users.insertedIds[0], updateData);
          //if(user.length > 1) {
          this.repository.edit(users.insertedIds[1], updateData)
          // }
        })
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
      .then(([data, count]) => {
        return {
          items: data.map(item => this.mapUserToDto(item)),
          totalCount: count,
        };
      });
  }

  mapUserToDto(user) {
    return user ? {
      id: user._id,
      email: user.email,
      role: user.role,
      age: user.age,
      login: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      settings: settingService.mapSettingsToDto(this.getSettings(user.settings)),
    } : {};
  }

  getSettings(settings) {
    return settings && settings.length ? settings[0] : settings;
  }

  mapDtoToUser(dto) {
    return dto ? {
      email: dto.email,
      age: dto.age,
      role: dto.role,
      fullName: dto.login,
      firstName: dto.firstName,
      lastName: dto.lastName,
      address: dto.address,
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
