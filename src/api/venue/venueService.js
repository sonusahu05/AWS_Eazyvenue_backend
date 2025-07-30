const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require("fs");
const VenueRepository = require('./venueRepository');
const cipher = require('../common/auth/cipherHelper');
const CustomErrorService = require('../../utils/customErrorService');
const { api, frontEnd, picture } = require('config');
var moment = require('moment');
const Venue = require('../../../model/Venue');
class VenueService {
    constructor() {
        this.repository = new VenueRepository();
    }

    addvenue(venue) {
        return this.repository.add(venue);
        /*return this.repository.findByvenueName(venue).then((existingvenue) => {
            if (existingvenue.length > 0) {
                throw new Error('venue already exists');
            }
            return this.repository.add(venue);
        })*/
    }
    findById(id, showAll) {
        return this.repository.findById(id)
            .then(venue => this.mapVenueToDto(venue[0], showAll));
    }

    addMany(venues) {
        return this.repository.addMany(venues);
    }
    updatevenue(id, venueData) {
        return this.repository.edit(id, venueData).then((venue) => {
            return this.findById(id, true);
        });
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

    getPhotoURL(name) {
        if (typeof name !== 'undefined' && name !== null) {
            var imgpath = picture.venuePicFolder + name;
            if (fs.existsSync(imgpath)) {
                return frontEnd.picPath + "/" + picture.showVenuePicFolderPath + name;
            } else {
                return '';
            }
        } else {
            return '';
        }
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
    getDecorImageUrl(imageNames) {
        if (typeof imageNames !== 'undefined' && imageNames !== null) {
            var imagePath = [];

            imageNames.forEach(element => {
                var decorImage = picture.decorPicFolder + element.venue_image_src;
                if (fs.existsSync(decorImage)) {
                    imagePath.push({ venue_image_src: frontEnd.picPath + "/" + picture.showDecorPicFolderPath + element.venue_image_src, alt: element.alt, default: element.default });
                } else {
                    imagePath.push(frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
                }

            })
            return imagePath;
        } else {
            return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
        }
    }
    getVideoURL(name) {
        if (typeof name !== 'undefined' && name !== null && name != "") {
            var imgpath = picture.venueVideoFolder + name;
            if (fs.existsSync(imgpath)) {
                return frontEnd.picPath + "/" + picture.showVenueVideoFolderPath + name;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    getPhotoUrl(photoName) {
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

    mapVenueToDto(venue, showAll) {
        // Handle amenities - support both old format (string) and new format (array)
        let processedAmenities = '';
        try {
            if (venue.amenities) {
                if (Array.isArray(venue.amenities)) {
                    // New format: array of objects -> process and return as array
                    processedAmenities = venue.amenities.map(amenity => {
                        if (typeof amenity === 'object' && amenity.name && amenity.value) {
                            return {
                                name: amenity.name,
                                value: amenity.value,
                            };
                        }
                        return amenity;
                    });
                } else if (typeof venue.amenities === 'string') {
                    // Old format: string -> keep as is
                    processedAmenities = venue.amenities;
                } else {
                    // Fallback
                    processedAmenities = '';
                }
            } else {
                processedAmenities = '';
            }
        } catch (amenityError) {
            processedAmenities = '';
        }
        
        var createdBy;
        var updatedBy;
        var venueownerId;
        var venueownerFname;
        var venueownerLname;
        var venueownerMobile;
        var venueownerEmail;
        var venueownerGender;
        var venueownerProfile;
        
        try {
            if (venue.createduserdata && venue.createduserdata[0]) {
                createdBy = venue.createduserdata[0].firstName + ' ' + venue.createduserdata[0].lastName;
            }
            if (venue.updateduserdata && venue.updateduserdata.length > 0) {
                updatedBy = venue.updateduserdata[0].firstName + ' ' + venue.updateduserdata[0].lastName;
            }
            
            if (venue.venueownerdata.length > 0) {
                venueownerId = venue.venueownerdata[0]._id;
                venueownerFname = venue.venueownerdata[0].firstName;
                venueownerLname = venue.venueownerdata[0].lastName;
                venueownerMobile = venue.venueownerdata[0].mobileNumber;
                venueownerEmail = venue.venueownerdata[0].email;
                venueownerGender = venue.venueownerdata[0].gender;
                venueownerProfile = venue.venueownerdata[0].profilepic;
            }
        } catch (error) {
            console.error('Error processing venue owner data:', error);
        }


        let slot = venue.slotfilterdata.map((slot) => {
            const { _id, slotId, slotdate, slotenddate } = slot;
            return { _id, slotId, slotdate, slotenddate }
        });


        if (showAll) {
            return venue ? {
                id: venue._id,
                name: venue.name,
                description: venue.description,
                shortdescription: venue.shortdescription,
                reviews: venue.reviews || [],
                category: venue.category,
                propertyType: venue.propertyType,
                foodType: venue.foodType,
                foodMenuType: venue.foodMenuType,
                roomData: venue.roomData,
                venueImage: this.getVenueImageUrl(venue.venueImage),
                decor1Image: this.getDecorImageUrl(venue.decor1Image),
                decor2Image: this.getDecorImageUrl(venue.decor2Image),
                decor3Image: this.getDecorImageUrl(venue.decor3Image),
                venueVideo: this.getVideoURL(venue.venueVideo),
                email: venue.email,
                metaUrl: venue.metaUrl,
                metaDescription: venue.metaDescription,
                metaKeywords: venue.metaKeywords,
                mobileNumber: venue.mobileNumber,
                capacity: venue.capacity,
                area: venue.area,
                theaterSitting: venue.theaterSitting,
                capacityDescription: venue.capacityDescription,
                acdetails: venue.acdetails,
                parkingdetails: venue.parkingdetails,
                kitchendetails: venue.kitchendetails,
                decorationdetails: venue.decorationdetails,
                amenities: processedAmenities,
                roundTable: venue.roundTable,
                venueownerId: venueownerId,
                venueownerFname: venueownerFname,
                venueownerLname: venueownerLname,
                venueownerMobile: venueownerMobile,
                venueownerEmail: venueownerEmail,
                venueownerGender: venueownerGender,
                venueownerProfile: this.getPhotoURL(venueownerProfile),
                address: venue.address,
                statename: venue.statename,
                statecode: venue.statecode,
                cityname: venue.cityname,
                citycode: venue.citycode,
                // subarea: venue.subarea,
                zipcode: venue.zipcode,
                lat: venue.lat,
                lng: venue.lng,
                latitude: venue.lat,   // For frontend compatibility
                longitude: venue.lng,  // For frontend compatibility
                featured: venue.featured,
                assured: venue.assured,
                status: venue.status,
                disable: venue.disable,
                created_by: venue.created_by,
                createdBy: createdBy,
                created_at: venue.created_at,
                updated_at: venue.updated_at,
                updatedBy: updatedBy,
                updatedby: venue.updated_by,
                minPrice: venue.minPrice,
                maxPrice: venue.maxPrice,
                decor1Price: venue.decor1Price,
                decor2Price: venue.decor2Price,
                decor3Price: venue.decor3Price,
                googleRating: venue.googleRating,
                eazyVenueRating: venue.eazyVenueRating,
                peopleBooked: venue.peopleBooked,
                views: venue.views,
                subarea: venue.subareadata[0]?.name,
                couponCode: venue.couponCode,
                isSwimmingPool: venue.isSwimmingPool,
                isParking: venue.isParking,
                isAC: venue.isAC,
                isGreenRooms: venue.isGreenRooms,
                isPowerBackup: venue.isPowerBackup,
                isDJ: venue.isDJ,
                isEntertainmentLicense: venue.isEntertainmentLicense,
                slot: slot,
                cancellationDescription: venue.cancellationDescription,
                isPrivateParties: venue.isPrivateParties,
                isWaiterService: venue.isWaiterService,
                isVIPSection: venue.isVIPSection,
                isRooms: venue.isRooms,
                isPillarFree: venue.isPillarFree,
                minRevenue: venue.minRevenue,
                venuePrice: venue.venuePrice,
                latitude: venue.latitude,
                longitude: venue.longitude,
                lat: venue.lat,
                lng: venue.lng,

            } : {};
        } else {
            return venue ? {
                id: venue._id,
                name: venue.name,
                description: venue.description,
                shortdescription: venue.shortdescription,
                reviews: venue.reviews || [],
                category: venue.category,
                propertyType: venue.propertyType,
                foodType: venue.foodType,
                foodMenuType: venue.foodMenuType,
                roomData: venue.roomData,
                venueImage: this.getVenueImageUrl(venue.venueImage),
                decor1Image: this.getDecorImageUrl(venue.decor1Image),
                decor2Image: this.getDecorImageUrl(venue.decor2Image),
                decor3Image: this.getDecorImageUrl(venue.decor3Image),
                venueVideo: this.getVideoURL(venue.venueVideo),
                email: venue.email,
                metaUrl: venue.metaUrl,
                metaDescription: venue.metaDescription,
                metaKeywords: venue.metaKeywords,
                mobileNumber: venue.mobileNumber,
                capacity: venue.capacity,
                area: venue.area,
                theaterSitting: venue.theaterSitting,
                capacityDescription: venue.capacityDescription,
                acdetails: venue.acdetails,
                parkingdetails: venue.parkingdetails,
                kitchendetails: venue.kitchendetails,
                decorationdetails: venue.decorationdetails,
                amenities: processedAmenities,
                roundTable: venue.roundTable,
                venueownerId: venueownerId,
                venueownerFname: venueownerFname,
                venueownerLname: venueownerLname,
                venueownerMobile: venueownerMobile,
                venueownerEmail: venueownerEmail,
                venueownerGender: venueownerGender,
                venueownerProfile: this.getPhotoUrl(venueownerProfile),
                address: venue.address,
                statename: venue.statename,
                statecode: venue.statecode,
                cityname: venue.cityname,
                citycode: venue.citycode,
                // subarea: venue.subarea,
                zipcode: venue.zipcode,
                lat: venue.lat,
                lng: venue.lng,
                latitude: venue.lat,   // For frontend compatibility
                longitude: venue.lng,  // For frontend compatibility
                featured: venue.featured,
                assured: venue.assured,
                minPrice: venue.minPrice,
                maxPrice: venue.maxPrice,
                decor1Price: venue.decor1Price,
                decor2Price: venue.decor2Price,
                decor3Price: venue.decor3Price,
                googleRating: venue.googleRating,
                bookingPrice: venue.bookingPrice,
                eazyVenueRating: venue.eazyVenueRating,
                peopleBooked: venue.peopleBooked,
                views: venue.views,
                minRevenue: venue.minRevenue,
                venuePrice: venue.venuePrice,
                subarea: venue.subareadata[0]?.name,
                couponCode: venue.couponCode,
                isSwimmingPool: venue.isSwimmingPool,
                isParking: venue.isParking,
                isAC: venue.isAC,
                isGreenRooms: venue.isGreenRooms,
                isPowerBackup: venue.isPowerBackup,
                isDJ: venue.isDJ,
                isEntertainmentLicense: venue.isEntertainmentLicense,
                slot: slot,
                cancellationDescription: venue.cancellationDescription,
                isPrivateParties: venue.isPrivateParties,
                isWaiterService: venue.isWaiterService,
                isVIPSection: venue.isVIPSection,
                isRooms: venue.isRooms,
                isPillarFree: venue.isPillarFree,
                latitude: venue.latitude,
                longitude: venue.longitude,
                lat: venue.lat,
                lng: venue.lng,
            } : {};
        }
    }
}

module.exports = VenueService;