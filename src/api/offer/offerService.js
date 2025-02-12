const OfferRepository = require('./offerRepository');
const { api, frontEnd, picture } = require('config');
const fs = require("fs");

class OfferService {
    constructor() {
        this.repository = new OfferRepository();
    }

    getVenueImageUrl(imageNames) {
        if (typeof imageNames !== 'undefined' && imageNames !== null) {
            var imagePath = [];
            imageNames.forEach(element => {
                var offerImage = picture.offerPicFolder + element.offer_image_src;
                if (fs.existsSync(offerImage)) {
                    imagePath.push({ offer_image_src: frontEnd.picPath + "/" + picture.showVenueofferPicFolder + element.offer_image_src, alt: element.alt, default: element.default });
                } else {
                    imagePath.push(frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg');
                }

            })
            return imagePath;
        } else {
            return frontEnd.picPath + "/" + picture.defaultPicFolderPath + 'bannerDefault.jpg';
        }
    }

    findById(id) {
        return this.repository.findById(id)
            .then(offer => this.mapVenueToDto(offer[0]));
    }

    updateOffer(id, offerData) {
        return this.repository.edit(id, offerData).then((offer) => {
            return this.findById(id);
        });
    }

    list(filter,showAll) {
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
    mapVenueToDto(offer, showAll) {

    const occasion= offer?.occasion?.map((occasion)=>{
        const {_id, name,slug} = occasion;
        return {_id,name,slug}
    })

    const assign_offer_to= offer?.assign_offer_to?.map((assign_offer_to)=>{
        const {_id, name,slug} = assign_offer_to;
        return {_id,name,slug}
    })

   const venue= offer?.venue?.map((venue)=>{
        const {_id, name,slug} = venue;
        return {_id,name,slug}
    })

    const city= offer?.city?.map((city)=>{
        const {_id, name,slug} = city;
        return {_id,name,slug}
    })

    const subarea= offer?.subarea?.map((subarea)=>{
        const {_id, name,slug} = subarea;
        return {_id,name,slug}
    })

        if (showAll) {
            return offer ? {
                id: offer._id,
                name:offer.name,
                title: offer.title,
                code: offer.code,
                description: offer.description,
                offer_valid_from: offer.offer_valid_from,
                offer_valid_to: offer.offer_valid_to,
                offer_type:offer.offer_type,
                is_amount:offer.is_amount,
                discount_percentage:offer.discount_percentage,
                discount_amount:offer.discount_amount,
                mimimum_amount:offer.mimimum_amount,
                offer_allocation:offer.offer_allocation,
                assign_offer_to:assign_offer_to,
                occasion:occasion,
                city:city,
                subarea:subarea,
                venue:venue,
                promo_display_type:offer.promo_display_type,
                status: offer.status,
                disable: offer.disable,
                created_at: offer.created_at,
                updated_at: offer.updated_at,
                offerImage: this.getVenueImageUrl(offer.offerImage),

            } : {};
        } else {

            return offer ? {
                id: offer._id,
                name:offer.name,
                title: offer.title,
                code: offer.code,
                description: offer.description,
                offer_valid_from: offer.offer_valid_from,
                offer_valid_to: offer.offer_valid_to,
                offer_type:offer.offer_type,
                is_amount:offer.is_amount,
                discount_percentage:offer.discount_percentage,
                discount_amount:offer.discount_amount,
                mimimum_amount:offer.mimimum_amount,
                offer_allocation:offer.offer_allocation,
                assign_offer_to:assign_offer_to,
                occasion:occasion,
                city:city,
                subarea:subarea,
                venue:venue,
                promo_display_type:offer.promo_display_type,
                status: offer.status,
                disable: offer.disable,
                created_at: offer.created_at,
                updated_at: offer.updated_at,
                offerImage: this.getVenueImageUrl(offer.offerImage),

            } : {};
        }
    }
}
module.exports = OfferService;