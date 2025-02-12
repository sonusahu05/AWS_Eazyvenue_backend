const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const VenueorderRepository = require('./venueorderRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');

class VenueorderService {
    constructor() {
        this.repository = new VenueorderRepository();
    }
    addvenueorder(venueorderData) {
        return this.repository.add(venueorderData);
    }
    findById(id) {
        return this.repository.findById(id)
            .then(venueorder => this.mapVenueorderToDto(venueorder[0]));
    }
    updateVenueorder(id, venueorderData) {
        return this.repository.edit(id, venueorderData).then((venueorder) => {
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
                    items: data.map(item => this.mapVenueorderToDto(item))
                };
            });
    }
    getVenueImageUrl(imageNames) {
        if (typeof imageNames !== 'undefined' && imageNames !== null) {
            var imagePath = [];
            imageNames.forEach(element => {
                var venueImage = picture.venuePicFolder + element.venue_image_src;
                if (fs.existsSync(venueImage)) {
                    imagePath.push({ venue_image_src: frontEnd.picPath + "/" + picture.showVenuePicFolderPath + element.venue_image_src, alt: element.alt, default: element.default });
                } else {
                    imagePath.push(frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
                }

            })
            return imagePath;
        } else {
            return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
        }
    }
    getPhotoURL(name) {
        if (typeof name !== 'undefined' && name !== null) {
            var imgpath = picture.categoryPicFolder + name;
            if (fs.existsSync(imgpath)) {
                return frontEnd.picPath + "/" + picture.showCategoryPicFolderPath + name;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }
    mapVenueorderToDto(venueorder) {
        var createdBy;
        if (venueorder.createduserdata) {
            createdBy = venueorder.createduserdata[0].firstName + ' ' + venueorder.createduserdata[0].lastName;
        }
        var updatedBy;
        if (venueorder.updateduserdata.length > 0) {
            updatedBy = venueorder.updateduserdata[0].firstName + ' ' + venueorder.updateduserdata[0].lastName;
        }
        var customerName;
        var categoryImage;
        var customermobileNumber;
        var customeremail;
        if (venueorder.customerdata.length > 0) {
            customerName = venueorder.customerdata[0].fullName;
            customermobileNumber = venueorder.customerdata[0].mobileNumber;
            customeremail = venueorder.customerdata[0].email;
        }
        var venueName;
        var venueImage;
        var venueaddress;
        var venuecity;
        var venuezipcode;
        var venuestate;
        var venuefoodType;
        var venuefoodMenuType;
        var venuedecor1Price;
        var venuedecor2Price;
        var venuePrice;
        var venuedecor3Price;

        if (venueorder.venuedata.length > 0) {
            venueName = venueorder.venuedata[0].name;
            venueImage = venueorder.venuedata[0].venueImage;
            venueaddress = venueorder.venuedata[0].address;
            venuecity = venueorder.venuedata[0].cityname;
            venuezipcode = venueorder.venuedata[0].zipcode;
            venuestate = venueorder.venuedata[0].statename;
            venuefoodType = venueorder.venuedata[0].foodType;
            venuefoodMenuType = venueorder.venuedata[0].foodMenuType;
            venuedecor1Price = venueorder.venuedata[0].decor1Price;
            venuedecor2Price = venueorder.venuedata[0].decor2Price;
            venuedecor3Price = venueorder.venuedata[0].decor3Price;
            venuePrice = venueorder.venuedata[0].venuePrice;
        }
        var categoryName;
        var categorySlug;
        if (venueorder.categorydata.length > 0) {
            categoryName = venueorder.categorydata[0].name;
            categoryImage = this.getPhotoURL(venueorder.categorydata[0].categoryImage);
            categorySlug = venueorder.categorydata[0].slug;
        }
        var vendorarr = [];
        if (venueorder.vendordata.length > 0) {
            venueorder.vendordata.forEach(element => {
                vendorarr.push({ 'id': element._id, name: element.name });
            })
        }

        var customerselectedFoodrarr = [];
        if (venueorder.foodTypedata.length > 0) {
            venueorder.foodTypedata.forEach(element => {
                customerselectedFoodrarr.push({ 'slug': element.slug, name: element.name });
            })
        }
        var customerselectedFoodmenurarr = [];
        if (venueorder.foodmenudata.length > 0) {
            venueorder.foodmenudata.forEach(element => {
                customerselectedFoodmenurarr.push({ 'slug': element.slug, name: element.name });
            })
        }
        var customerselectedduration = [];
        var postavailabilitiesdata = [];
        postavailabilitiesdata = venueorder.postavailabilitiesdata;
        // console.log(postavailabilitiesdata);
        // console.log(Object.keys(postavailabilitiesdata));
        if (venueorder.duration.length > 0) {

            let durationArr = venueorder.duration;
            durationArr.forEach(element => {
                //let propertyObj = postavailabilitiesdata.find(o => o._id === element.postavailabilityId);        
                //console.log(propertyObj);
                customerselectedduration.push({ 'occasionDate': element.occasionDate });
            })
        }
        return venueorder ? {
            id: venueorder._id,
            customerId: venueorder.customerId,
            customerName: customerName,
            customermobileNumber: customermobileNumber,
            customeremail: customeremail,
            venueId: venueorder.venueId,
            venueName: venueName,
            venueImage: this.getVenueImageUrl(venueImage),
            venueaddress: venueaddress,
            venuecity: venuecity,
            venuestate: venuestate,
            venuezipcode: venuezipcode,
            venuefoodType: venuefoodType,
            venuefoodMenuType: venuefoodMenuType,
            venuePrice: venuePrice,
            venuedecor1Price: venuedecor1Price,
            venuedecor2Price: venuedecor2Price,
            venuedecor3Price: venuedecor3Price,
            categoryId: venueorder.categoryId,
            categoryName: categoryName,
            categorySlug: categorySlug,
            categoryImage: categoryImage,
            occasionDate: venueorder.occasionDate,
            orderType: venueorder.orderType,
            duration: venueorder.duration,
            decorName: venueorder.decorName,
            //occasionDate: venueorder.occasionDate,
            guestcnt: venueorder.guestcnt,
            foodMenuType: venueorder.foodMenuType,
            foodType: venueorder.foodType,
            customerselecteddecor: venueorder.decor,
            customerselectedvendors: venueorder.vendors,
            customerselectedvendorarr: vendorarr,
            customerselectedFoodrarr: customerselectedFoodrarr,
            customerselectedFoodmenurarr: customerselectedFoodmenurarr,
            customerselectedduration: customerselectedduration,
            comment: venueorder.comment,
            price: venueorder.price,
            status: venueorder.status,
            disable: venueorder.disable,
            created_by: venueorder.created_by,
            createdBy: createdBy,
            created_at: venueorder.created_at,
            updated_at: venueorder.updated_at,
            updatedBy: updatedBy,
            updatedby: venueorder.updated_by,
        } : {};
    }
}
module.exports = VenueorderService;