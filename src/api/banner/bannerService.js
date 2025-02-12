const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const BannerRepository = require('./bannerRepository');
const SettingService = require('../common/settings/settingsService');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const settingService = new SettingService();
const { api, frontEnd, picture } = require('config');
var moment = require('moment');
var path = require('path');
class BannerService {
  constructor() {
    this.repository = new BannerRepository();
  }

  getCount() {
    return this.repository.getCount();
  }

  findById(id) {
    return this.repository.findById(id)
      .then(banner => this.mapBannerToDto(banner));
  }

  addBanner(banner) {
    return this.repository.checkDuplicateBanner(banner).then((existingBanner) => {
      if (existingBanner.length > 0) {
        throw new Error('Banner already exists');
      } else {
        return this.repository.add(banner);
      }
    })
    //return this.repository.add(banner);
  }

  addMany(users) {
    return this.repository.addMany(users);
  }

  updateBanner(id, bannerData) {
    return this.repository.edit(id, bannerData).then((banner) => {
      return this.findById(id);
    });
  }

  editBanner(dto, userId) {
    const banner = this.mapDtoToBanner(dto);

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

  editCurrentbanner(dto, userId) {
    return this.editBanner(dto, userId)
      .then(user => {
        return cipher.generateResponseTokens(user);
      })
      .catch(error => {
        throw error;
      });
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
          totalCount: totalRecords.length,
          items: data.map(item => this.mapBannerToDto(item)),
        };
      });
  }

  getBannerImageUrl(imageNames) {
    if (typeof imageNames !== 'undefined' && imageNames !== null) {
      var imagePath = [];
      imageNames.forEach(element => {
        var bannerImage = picture.bannerImageFolder + element.banner_image_src;
        if (fs.existsSync(bannerImage)) {
          imagePath.push({ banner_image_src: frontEnd.picPath  + "/" + picture.showBannerPicFolderPath + element.banner_image_src, alt: element.alt, default: element.default });
        } else {
          imagePath.push(frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
        }

      })
      return imagePath;
    } else {
      return frontEnd.picPath  + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
    }
  }

  mapBannerToDto(banner) {
    var createdBy;

    if (banner.createduserdata) {
      createdBy = banner.createduserdata[0].firstName + ' ' + banner.createduserdata[0].lastName;
    }
    var updatedBy;
    if (banner.updateduserdata.length > 0) {
      updatedBy = banner.updateduserdata[0].firstName + ' ' + banner.updateduserdata[0].lastName;
    }
    var bannerVisible;
    return banner ? {
      id: banner._id,
      banner_title: banner.banner_title,
      slug: banner.slug,
      banner_image: this.getBannerImageUrl(banner.banner_image),
      // banner_url:banner.banner_url,
      // banner_content:banner.banner_content,
      status: banner.status,
      disable: banner.disable,
      created_at: banner.created_at,
      updated_at: banner.updated_at,
      createdby: banner.created_by,
      createdBy: createdBy,
      updatedby: banner.updated_by,
      updatedBy: updatedBy,
      bannerVisible: false,
    } : {};
  }

  mapDtoToBanner(dto) {
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


}

module.exports = BannerService;