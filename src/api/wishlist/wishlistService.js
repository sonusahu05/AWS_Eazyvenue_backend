const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const WishlistsRepository = require('./wishlistRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
let moment = require('moment');
class WishlistsService {
    constructor() {
        this.repository = new WishlistsRepository();
    }
    addWishlist(wishlistsData) {
        return this.repository.findByWishlist(wishlistsData).then((existingWishlistsData) => {
            if (existingWishlistsData.length > 0) {
                let wishlistObj = {
                    disable: true,
                }
                return this.repository.edit(existingWishlistsData[0]._id, { disable: wishlistsData.disable }).then((wishlists) => {
                    return this.findById(existingWishlistsData[0]._id);
                });
            } else {
                return this.repository.add(wishlistsData);
            }
        })
        //return this.repository.add(wishlistsData);
    }
    findById(id) {
        return this.repository.findById(id)
            .then(wishlists => this.mapWishlistsToDto(wishlists[0]));
    }
    updateWishlists(id, wishlistsData) {
        return this.repository.edit(id, wishlistsData).then((wishlists) => {
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
                    items: data.map(item => this.mapWishlistsToDto(item))
                };
            });
    }
    getVenueImageUrl(imageNames) {
        if (typeof imageNames !== 'undefined' && imageNames !== null) {
            let imagePath = [];
            imageNames.forEach(element => {
                let venueImage = picture.venuePicFolder + element.venue_image_src;
                if (fs.existsSync(venueImage)) {
                    imagePath.push({ venue_image_src: frontEnd.picPath + api.port + "/" + picture.showVenuePicFolderPath + element.venue_image_src, alt: element.alt, default: element.default });
                } else {
                    imagePath.push(frontEnd.picPath + api.port + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
                }
            })
            return imagePath;
        } else {
            return frontEnd.picPath + api.port + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
        }
    }
    getPhotoURL(name) {
        if (typeof name !== 'undefined' && name !== null) {
            let imgpath = picture.categoryPicFolder + name;
            if (fs.existsSync(imgpath)) {
                return frontEnd.picPath + api.port + "/" + picture.showCategoryPicFolderPath + name;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }
    mapWishlistsToDto(wishlists) {
        let createdBy;
        // if (wishlists.createduserdata) {
        //     createdBy = wishlists.createduserdata[0].firstName + ' ' + wishlists.createduserdata[0].lastName;
        // }
        let updatedBy;
        // if (wishlists.updateduserdata.length > 0) {
        //     updatedBy = wishlists.updateduserdata[0].firstName + ' ' + wishlists.updateduserdata[0].lastName;
        // }
        let customerName;
        let customermobileNumber;
        let customeremail;
        if (wishlists.customerdata.length > 0) {
            customerName = wishlists.customerdata[0].fullName;
            customermobileNumber = wishlists.customerdata[0].mobileNumber;
            customeremail = wishlists.customerdata[0].email;
        }
        let venueName;
        let venueImage;
        let venueaddress;
        let venuecity;
        let venuezipcode;
        let venuestate;
        let venuefoodType;
        let venuefoodMenuType;
        let venuePrice;
        if (wishlists.venuedata.length > 0) {
            venueName = wishlists.venuedata[0].name;
            venueImage = wishlists.venuedata[0].venueImage;
            venueaddress = wishlists.venuedata[0].address;
            venuecity = wishlists.venuedata[0].cityname;
            venuezipcode = wishlists.venuedata[0].zipcode;
            venuestate = wishlists.venuedata[0].statename;
            venuefoodType = wishlists.venuedata[0].foodType;
            venuefoodMenuType = wishlists.venuedata[0].foodMenuType;
            venuePrice = wishlists.venuedata[0].venuePrice;
        }
        return wishlists ? {
            id: wishlists._id,
            customerId: wishlists.customerId,
            customerName: customerName,
            customermobileNumber: customermobileNumber,
            customeremail: customeremail,
            venueId: wishlists.venueId,
            venueName: venueName,
            venueImage: this.getVenueImageUrl(venueImage),
            venueaddress: venueaddress,
            venuecity: venuecity,
            venuestate: venuestate,
            venuezipcode: venuezipcode,
            venuefoodType: venuefoodType,
            venuefoodMenuType: venuefoodMenuType,
            venuePrice: venuePrice,
            status: wishlists.status,
            disable: wishlists.disable,
            created_by: wishlists.created_by,
            createdBy: createdBy,
            created_at: wishlists.created_at,
            updated_at: wishlists.updated_at,
            updatedBy: updatedBy,
            updatedby: wishlists.updated_by,
        } : {};
    }
}
module.exports = WishlistsService;