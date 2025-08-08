const VendorRepository = require('./vendorRepository');
const { api, frontEnd, picture } = require('config');
class VendorService{
    constructor(){
        this.repository = new VendorRepository();
    }

    addVendor(vendor){
        return this.repository.add(vendor);
    }

    list(filter, showAll) {
        return Promise.all([
            this.repository.listFiltered(filter),
            this.repository.getCountFiltered(filter),
        ])
            .then(([data, totalRecords]) => {
                return {
                    totalCount: totalRecords.length,
                    items: data.map(item => this.mapVenueToDto(item, showAll))
                };
            });
    }
    getVendorImageUrl(imageNames) {
        if (typeof imageNames !== 'undefined' && imageNames !== null) {
            var imagePath = [];
            imageNames.forEach(element => {
                var venueImage = picture.vendorPicFolder + element.vendor_image;
                if (require('fs').existsSync(venueImage)) {
                    imagePath.push({ vendor_image_src: frontEnd.picPath + "/" + picture.showVendorPicFolderPath + element.vendor_image, alt: element.alt, default: element.default });
                } else {
                    imagePath.push(frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
                }

            })
            return imagePath;
        } else {
            return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
        }
    }
    getOwnerPhotoURL(photoName) {
        if (typeof photoName !== 'undefined' && photoName !== null) {
            var profilePic = picture.profilePicFolder + photoName;
            if (fs.existsSync(profilePic)) {
                return frontEnd.picPath + "/" + picture.showPicFolderPath + photoName;
            } else {
                return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'profile.jpg';
            }
        } else {
            return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'profile.jpg';
        }
    }
    mapVenueToDto(vendor, showAll) {
        console.log(vendor);
        var createdBy;
        if (vendor.createduserdata) {
            createdBy = vendor.createduserdata[0]?.firstName + ' ' + vendor.createduserdata[0]?.lastName;
        }
        var updatedBy;
        if (vendor.updateduserdata && vendor.updateduserdata.length > 0) {
            updatedBy = vendor.updateduserdata[0]?.firstName + ' ' + vendor.updateduserdata[0]?.lastName;
        }



        var vendorownerId;
        var vendorownerFname;
        var vendorownerLname;
        var vendorownerMobile;
        var vendorownerEmail;

        var vendorownerGender;
        var vendorownerProfile;
        if (vendor.vendorownerdata.length > 0) {
            vendorownerId = vendor.vendorownerdata[0]._id;
            vendorownerFname = vendor.vendorownerdata[0].firstName;
            vendorownerLname = vendor.vendorownerdata[0].lastName;
            vendorownerMobile = vendor.vendorownerdata[0].mobileNumber;
            vendorownerEmail = vendor.vendorownerdata[0].email;
            vendorownerGender = vendor.vendorownerdata[0].gender;
            vendorownerProfile = vendor.vendorownerdata[0].profilepic;
        }


        // let slot = vendor.slotfilterdata.map((slot) => {
        //     const { _id, slotId, slotdate, slotenddate } = slot;
        //     return { _id, slotId, slotdate, slotenddate }
        // })


        
            return {
                id: vendor._id,
                name: vendor.name,
                longdescription: vendor.longDescription,
                shortdescription: vendor.shortDescription,
                categories:vendor.categories,
                vendorImage: this.getVendorImageUrl(vendor.images),
                email: vendor.email,
                mobileNumber: vendor.mobileNumber,
                services: vendor.services,
                deal:vendor.deal,
                availableInCities: vendor.availableInCities,
                responseTime: vendor.responseTime,
                workExperience: vendor.workExperience,
                vendorownerId: vendorownerId,
                vendorownerFname: vendorownerFname,
                vendorownerLname: vendorownerLname,
                vendorownerMobile: vendorownerMobile,
                vendorownerEmail: vendorownerEmail,
                vendorownerGender: vendorownerGender,
                vendorownerProfile: this.getOwnerPhotoURL(vendorownerProfile),
                // address: vendor.address,
                statename: vendor.state.name,
                statecode: vendor.state.id,
                cityname: vendor.city.name,
                citycode: vendor.city.id,
                subarea: vendor.subarea.name,
                zipcode: vendor.zipcode,
                // latitude: vendor.latitude,
                // longitude: venue.longitude,
                // featured: venue.featured,
                // assured: venue.assured,
                status: vendor.status,
                disable: vendor.disable,
                created_by: vendor.created_by,
                createdBy: createdBy,
                created_at: vendor.created_at,
                updated_at: vendor.updated_at,
                updatedBy: updatedBy,
                updatedby: vendor.updated_by,
                // minPrice: venue.minPrice,
                // maxPrice: venue.maxPrice,
                // decor1Price: venue.decor1Price,
                // decor2Price: venue.decor2Price,
                // decor3Price: venue.decor3Price,
                googleRating: vendor.googleRating,
                eazyVenueRating: vendor.eazyVenueRating,
                peopleBooked: 0,
                views: 0,
                // subarea: vendor.subareadata[0]?.name,
                // couponCode: venue.couponCode,
                // isSwimmingPool: venue.isSwimmingPool,
                // isParking: venue.isParking,
                // isAC: venue.isAC,
                // isGreenRooms: venue.isGreenRooms,
                // isPowerBackup: venue.isPowerBackup,
                // isDJ: venue.isDJ,
                // isEntertainmentLicense: venue.isEntertainmentLicense,
                // slot: slot,
                // cancellationDescription: venue.cancellationDescription,
                // isPrivateParties: venue.isPrivateParties,
                // isWaiterService: venue.isWaiterService,
                // isVIPSection: venue.isVIPSection,
                // isRooms: venue.isRooms,
                // isPillarFree: venue.isPillarFree,
                // minRevenue: venue.minRevenue,
                // venuePrice: venue.venuePrice,

        }
    }

}

module.exports = VendorService;