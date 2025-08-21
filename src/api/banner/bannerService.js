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
      .then(([data, totalCount]) => { // Changed 'totalRecords' to 'totalCount' for clarity
        return {
          // FIX: Use the totalCount value directly. 
          // It should be a number, not an array.
          totalCount: totalCount,
          items: data.map(item => this.mapBannerToDto(item)),
        };
      })
      .catch(error => {
        // ADDED: Proper error handling.
        // This ensures that if the database query fails, the server sends an 
        // error response instead of hanging.
        console.error("Error fetching banner list:", error);
        // Re-throwing the error ensures the client receives a server error response.
        throw error;
      });
  }

getBannerImageUrl(imageNames) {
    // --- DEBUG: Log the input to see what data we're starting with ---
    console.log('[DEBUG] getBannerImageUrl received:', JSON.stringify(imageNames, null, 2));

    if (typeof imageNames !== 'undefined' && imageNames !== null && Array.isArray(imageNames)) {
      var imagePath = [];
      imageNames.forEach(element => {
        // --- DEBUG: Log each item in the array ---
        console.log('[DEBUG] Processing element:', JSON.stringify(element, null, 2));

        if (!element || typeof element.banner_image_src === 'undefined') {
          console.log('[DEBUG] Element is invalid or missing banner_image_src. Skipping.');
          return; // Skips to the next item in the forEach loop
        }

        // --- DEBUG: Log the server path being checked for existence ---
        const localFilePath = picture.bannerImageFolder + element.banner_image_src;
        console.log('[DEBUG] Checking for file at local path:', localFilePath);

        const fileExists = fs.existsSync(localFilePath);
        // --- DEBUG: Log whether the file was found or not ---
        console.log(`[DEBUG] File exists? ${fileExists}`);

        if (fileExists) {
          const finalImageUrl = {
            banner_image_src: frontEnd.picPath + "/" + picture.showBannerPicFolderPath + element.banner_image_src,
            alt: element.alt,
            default: element.default
          };
          // --- DEBUG: Log the final public URL being sent to the client ---
          console.log('[DEBUG] SUCCESS: Pushing public image URL:', JSON.stringify(finalImageUrl, null, 2));
          imagePath.push(finalImageUrl);
        } else {
          const defaultImageUrl = frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
    
          console.log('[DEBUG] FAILED: Pushing default image URL:', defaultImageUrl);
          imagePath.push(defaultImageUrl);
        }
      });
      return imagePath;
    } else {
      const defaultImageUrl = frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
      // --- DEBUG: Log that the input was invalid and a single default is being returned ---
      console.log('[DEBUG] Input `imageNames` was null, undefined, or not an array. Returning single default URL:', defaultImageUrl);
      return defaultImageUrl;
    }
  }

// In bannerService.js

  mapBannerToDto(banner) {
    if (!banner) {
      return {};
    }

    // --- SAFELY GET USER NAMES ---
    // CHANGED: Added checks to prevent crashing if user data is missing or empty.
    // Provides a fallback name 'N/A' if the author is not found.
    let createdByName = 'N/A';
    if (banner.createduserdata && banner.createduserdata.length > 0) {
      createdByName = banner.createduserdata[0].firstName + ' ' + banner.createduserdata[0].lastName;
    }

    let updatedByName = 'N/A';
    if (banner.updateduserdata && banner.updateduserdata.length > 0) {
      updatedByName = banner.updateduserdata[0].firstName + ' ' + banner.updateduserdata[0].lastName;
    }

    return {
      id: banner._id,
      banner_title: banner.banner_title,
      slug: banner.slug,
      banner_image: this.getBannerImageUrl(banner.banner_image),
      banner_content: banner.banner_content,
      banner_url: banner.banner_url,
      status: banner.status,
      disable: banner.disable,
      
      // Blog fields
      post_type: banner.post_type || 'regular',
      category: banner.category || 'general',
      author: banner.author || 'Admin',
      reading_time: banner.reading_time,
      meta_description: banner.meta_description,
      tags: banner.tags || [],
      featured_order: banner.featured_order || 0,
      instagram_url: banner.instagram_url,
      instagram_caption: banner.instagram_caption,
      is_video: banner.is_video || false,
      publish_date: banner.publish_date || banner.created_at,
      is_published: banner.is_published !== undefined ? banner.is_published : banner.status,
      seo_title: banner.seo_title,
      seo_keywords: banner.seo_keywords,
      
      // System fields
      created_at: banner.created_at,
      updated_at: banner.updated_at,
      createdby: banner.created_by, // The user ID
      updatedby: banner.updated_by, // The user ID

      // ADDED: Include the safe full names in the response for the frontend to use.
      createdByName: createdByName,
      updatedByName: updatedByName,
    };
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