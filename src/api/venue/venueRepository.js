const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
const { ObjectID } = require('mongodb');
class VenueRepository extends BaseRepository {
  constructor() {
    super('venues');
  }

  findByVenue(venue) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({
          "disable": { $eq: false }
        })
        .toArray());
  }

  findById(id) {
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { _id: ObjectId(id) }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'ownerId',
                foreignField: '_id',
                as: 'venueownerdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'created_by',
                foreignField: '_id',
                as: 'createduserdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'updated_by',
                foreignField: '_id',
                as: 'updateduserdata',
              },
            },
            {
              $lookup: {
                from: 'slots',
                localField: 'slot',
                foreignField: '_id',
                as: 'slotdata',
              },

            },
            {
              $lookup: {
                from: 'subareaes',
                localField: 'subareaid',
                foreignField: '_id',
                as: 'subareadata',
              },

            },
            {
              $lookup: {
                from: 'postavailabilities',
                localField: '_id',
                foreignField: 'venueId',
                as: 'slotfilterdata',
              },

            },
          ]);
        return data.toArray();
      });
  }

  listFiltered(filter1) {

    const filter = this._getListFilter(filter1);
    //return super.listFiltered(filter);
    var dateSearch = { $match: {} };

    if (typeof filter.filterByStartDate != "undefined" && typeof filter.filterByEndDate != "undefined") {
      let startdate = new Date(moment(filter.filterByStartDate));
      let enddate = new Date(moment(filter.filterByEndDate));
      enddate.setDate(enddate.getDate() + 1);
      if (filter.filterByDate == "created_at") {
        dateSearch = {
          $match: { "created_at": { $gte: startdate, $lte: enddate } },
        };
      }
      if (filter.filterByDate == "updated_at") {
        dateSearch = {
          $match: { "updated_at": { $gte: startdate, $lte: enddate } },
        };
      }
    }
    var updatedBySearch = { $match: {} };
    if (typeof filter.filterByUpdatedby !== 'undefined') {
      updatedBySearch = {
        $match: { "updateduserdata.fullName": { $regex: filter.filterByUpdatedby, $options: '-i' } },
      };
    }
    let fromdate = new Date(moment().utc());

    var updatedBySlot = { $match: {} };
    if (typeof filter.filterBySlotId !== 'undefined') {
      updatedBySlot = {
        $match: {
          $and: [
            { "slotfilterdata.slotId": { "$eq": ObjectId(filter.filterBySlotId) } },
            { 'slotfilterdata.slotdate': { $gte: fromdate } }
          ]

        }
      };
    }



    /// filter by Only date 
    var updatedByOnlyDate = { $match: {} };
    if (typeof filter.filterByStartDate !== 'undefined' && typeof filter.filterByEndDate !== 'undefined') {
      let startdate = moment(filter.filterByStartDate).utc().toDate();
      let enddate = moment(filter.filterByEndDate).utc().toDate();
      updatedByOnlyDate = {
        $match: {
          $and: [
            { 'slotfilterdata.slotdate': { $gte: startdate } },
            { 'slotfilterdata.slotenddate': { $lte: enddate } }
          ]
        }
      };
    }


    var updatedBySlotDate = { $match: {} }

    if (typeof filter.filterBySlotId !== 'undefined' && typeof filter.filterBySlotStartDate !== 'undefined' && filter.filterBySlotEndStart) {
      updatedBySlotDate = {
        $match: {
          $and: [
            { "slotfilterdata.slotId": { "$eq": ObjectId(filter.filterBySlotId) } },
            { 'slotfilterdata.slotdate': { $gte: new Date(moment(filter.filterBySlotStartDate)) }, 'slotfilterdata.slotenddate': { $lte: new Date(moment(filter.filterBySlotEndStart)) } }
          ]

        }
      };
    }


    var createdBySearch = { $match: {} };
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
        $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: '-i' } },
      };
    }


    let category = { $match: {} };
    if (filter.filterByCategory) {
      let categoryArr = [];
      categoryArr = filter.filterByCategory.split(",");
      let catArr = [];
      for (let i = 0; i < categoryArr.length; i++) {
        const obj = categoryArr[i];
        catArr.push(obj);
      }

      if (catArr) {
        category = {
          $match: {
            "category.id": { '$in': catArr }
          },
        }
      }
    }
    let propertyType = { $match: {} };
    if (filter.filterByPropertyType) {
      let propertyTypeArr = [];
      propertyTypeArr = filter.filterByPropertyType.split(",");
      let propArr = [];
      for (let i = 0; i < propertyTypeArr.length; i++) {
        const obj = propertyTypeArr[i];
        propArr.push(obj);
      }

      if (propArr) {
        propertyType = {
          $match: {
            "propertyType.id": { '$in': propArr }
          },
        }
      }
    }
    let foodType = { $match: {} };
    if (filter.filterByFoodType) {
      let foodTypeArr = [];
      foodTypeArr = filter.filterByFoodType.split(",");
      let foodArr = [];
      for (let i = 0; i < foodTypeArr.length; i++) {
        const obj = foodTypeArr[i];
        foodArr.push(obj);
      }

      if (foodArr) {
        foodType = {
          $match: {
            "foodType.id": { '$in': foodArr }
          },
        }
      }
    }
    let subarea = { $match: {} };
    if (filter.filterBySubareaIds) {
      let subareaArr = [];
      subareaArr = filter.filterBySubareaIds.split(",");
      let areaArr = [];
      for (let i = 0; i < subareaArr.length; i++) {
        const obj = ObjectId(subareaArr[i]);
        areaArr.push(obj);
      }

      if (areaArr) {
        subarea = {
          $match: {
            "subareaid": { '$in': areaArr }
          },
        }
      }
    }
    let cityFilter = { $match: {} };
    if (filter.filterByCities) {
      let citiesArr = [];
      citiesArr = filter.filterByCities.split(",");
      let citiesArray = [];
      for (let i = 0; i < citiesArr.length; i++) {
        const obj = citiesArr[i];
        citiesArray.push(obj);
      }

      if (citiesArray) {
        cityFilter = {
          $match: {
            "citycode": { '$in': citiesArray }
          },
        }
      }
    }
    let filterByPrice = { $match: {} };
    if (filter.filterByMinVenuePrice && filter.filterByMaxVenuePrice) {
      filterByPrice = {
        $match: { "maxPrice": { $gte: parseFloat(filter.filterByMinVenuePrice), $lte: parseFloat(filter.filterByMaxVenuePrice) } },
      };
    }
    let filterByCapacity = { $match: {} };
    if (filter.filterByGuestCondition == "lte" && filter.filterByGuestCapacity) {
      filterByCapacity = {
        $match: {
          "capacity": { $lte: parseFloat(filter.filterByGuestCapacity) }
        },
      };
    }
    if (filter.filterByGuestCondition == "gte" && filter.filterByGuestCapacity) {
      filterByCapacity = {
        $match: {
          "capacity": { $gte: parseFloat(filter.filterByGuestCapacity) }
        },
      };
    }
    let filterByMinGuarantee = { $match: {} };
    if (filter.filterByMinGuaranteeCondition === 'lte' && filter.filterByMinGuarantee) {
      filterByMinGuarantee = {
        $match: {
          'minRevenue': { $lte: parseFloat(filter.filterByMinGuarantee) }
        },
      };
    }
    if (filter.filterByMinGuaranteeCondition === 'gte' && filter.filterByMinGuarantee) {
      filterByMinGuarantee = {
        $match: {
          'minRevenue': { $gte: parseFloat(filter.filterByMinGuarantee) }
        },
      };
    }



    // seating capacity

    let filterBySeatCapacity = { $match: {} };
    if (filter.filterBySeatingCapacityCondition == "lte" && filter.filterBySeatingCapacity) {
      filterBySeatCapacity
        = {
        $match: {
          "theaterSitting": { $lte: parseFloat(filter.filterBySeatingCapacity) }
        },
      };
    }
    if (filter.filterBySeatingCapacityCondition == "gte" && filter.filterBySeatingCapacity) {
      filterBySeatCapacity = {
        $match: {
          "theaterSitting": { $gte: parseFloat(filter.filterBySeatingCapacity) }
        },
      };
    }



    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { $or: [filter.query] }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'ownerId',
                foreignField: '_id',
                as: 'venueownerdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'created_by',
                foreignField: '_id',
                as: 'createduserdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'updated_by',
                foreignField: '_id',
                as: 'updateduserdata',
              },
            },
            {
              $lookup: {
                from: 'slots',
                localField: 'slot',
                foreignField: '_id',
                as: 'slotdata',
              },

            },
            {
              $lookup: {
                from: 'subareaes',
                localField: 'subareaid',
                foreignField: '_id',
                as: 'subareadata',
              },

            },
            {
              $lookup: {
                from: 'postavailabilities',
                localField: '_id',
                foreignField: 'venueId',
                as: 'slotfilterdata',
              },

            },

            updatedBySearch,
            createdBySearch,
            category,
            propertyType,
            filterByPrice,
            filterByCapacity,
            foodType,
            updatedBySlot,
            updatedBySlotDate,
            updatedByOnlyDate,
            subarea,
            cityFilter,
            filterBySeatCapacity,
            filterByMinGuarantee
          ])
          .sort({ _id: -1 });
        if (filter.pageSize && filter.pageNumber) {
          data
            .skip(parseInt(filter.pageSize, 10) * (parseInt(filter.pageNumber, 10) - 1))
            .limit(parseInt(filter.pageSize, 10));
        }
        if (filter.sortBy && filter.orderBy) {
          const sortSettings = { [filter.sortBy]: filter.orderBy === 'ASC' ? 1 : -1 };
          data.collation({ locale: 'en' }).sort(sortSettings);
        }
        return data.toArray();
      });
  }

  getCountFiltered(filter1) {
    const filter = this._getListFilter(filter1);
    var dateSearch = { $match: {} };

    if (typeof filter.filterByStartDate != "undefined" && typeof filter.filterByEndDate != "undefined") {
      let startdate = new Date(moment(filter.filterByStartDate));
      let enddate = new Date(moment(filter.filterByEndDate));
      enddate.setDate(enddate.getDate() + 1);
      if (filter.filterByDate == "created_at") {
        dateSearch = {
          $match: { "created_at": { $gte: startdate, $lte: enddate } },
        };
      }
      if (filter.filterByDate == "updated_at") {
        dateSearch = {
          $match: { "updated_at": { $gte: startdate, $lte: enddate } },
        };
      }
    }
    var updatedBySearch = { $match: {} };
    if (typeof filter.filterByUpdatedby !== 'undefined') {
      updatedBySearch = {
        $match: { "updateduserdata.fullName": { $regex: filter.filterByUpdatedby, $options: '-i' } },
      };
    }

    let fromdate = new Date(moment().utc())
    var updatedBySlot = { $match: {} };

    if (typeof filter.filterBySlotId !== 'undefined') {

      updatedBySlot = {
        $match: {
          $and: [
            { "slotfilterdata.slotId": { "$eq": ObjectId(filter.filterBySlotId) } },
            { 'slotfilterdata.slotdate': { $gte: fromdate } }
          ]

        }
      };
    }

    /// filter by Only date 
    var updatedByOnlyDate = { $match: {} };
    if (typeof filter.filterByStartDate !== 'undefined' && typeof filter.filterByEndDate !== 'undefined') {
      let startdate = moment(filter.filterByStartDate).utc().toDate();
      let enddate = moment(filter.filterByEndDate).utc().toDate();
      updatedByOnlyDate = {
        $match: {
          $and: [
            { 'slotfilterdata.slotdate': { $gte: startdate } },
            { 'slotfilterdata.slotenddate': { $lte: enddate } }
          ]
        }
      };
    }

    var updatedBySlotDate = { $match: {} }

    if (typeof filter.filterBySlotId !== 'undefined' && typeof filter.filterBySlotStartDate !== 'undefined' && filter.filterBySlotEndStart) {
      updatedBySlotDate = {
        $match: {
          $and: [
            { "slotfilterdata.slotId": { "$eq": ObjectId(filter.filterBySlotId) } },
            { 'slotfilterdata.slotdate': { $gte: new Date(moment(filter.filterBySlotStartDate)) }, 'slotfilterdata.slotenddate': { $lte: new Date(moment(filter.filterBySlotEndStart)) } }
          ]

        }
      };
    }

    var createdBySearch = { $match: {} };
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
        $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: '-i' } },
      };
    }
    let category = { $match: {} };
    if (filter.filterByCategory) {
      let categoryArr = [];
      categoryArr = filter.filterByCategory.split(",");
      let catArr = [];
      for (let i = 0; i < categoryArr.length; i++) {
        let obj = categoryArr[i];
        catArr.push(obj);
      }

      if (catArr) {
        category = {
          $match: {
            "category.id": { '$in': catArr }
          },
        }
      }
    }
    let propertyType = { $match: {} };
    if (filter.filterByPropertyType) {
      let propertyTypeArr = [];
      propertyTypeArr = filter.filterByPropertyType.split(",");
      let propArr = [];
      for (let i = 0; i < propertyTypeArr.length; i++) {
        let obj = propertyTypeArr[i];
        propArr.push(obj);
      }

      if (propArr) {
        propertyType = {
          $match: {
            "propertytype.id": { '$in': propArr }
          },
        }
      }
    }
    let foodType = { $match: {} };
    if (filter.filterByFoodType) {
      let foodTypeArr = [];
      foodTypeArr = filter.filterByFoodType.split(",");
      let foodArr = [];
      for (let i = 0; i < foodTypeArr.length; i++) {
        let obj = foodTypeArr[i];
        foodArr.push(obj);
      }

      if (foodArr) {
        foodType = {
          $match: {
            "foodType.id": { '$in': foodArr }
          },
        }
      }
    }
    let filterByPrice = { $match: {} };
    if (filter.filterByMinVenuePrice && filter.filterByMaxVenuePrice) {
      filterByPrice = {
        $match: { "maxPrice": { $gte: parseFloat(filter.filterByMinVenuePrice), $lte: parseFloat(filter.filterByMaxVenuePrice) } },
      };
    }
    let filterByCapacity = { $match: {} };
    if (filter.filterByGuestCondition == "lte" && filter.filterByGuestCapacity) {
      filterByCapacity = {
        $match: {
          "capacity": { $lte: parseFloat(filter.filterByGuestCapacity) }
        },
      };
    }
    if (filter.filterByGuestCondition == "gte" && filter.filterByGuestCapacity) {
      filterByCapacity = {
        $match: {
          "capacity": { $gte: parseFloat(filter.filterByGuestCapacity) }
        },
      };
    }


    // seating capacity

    let filterBySeatCapacity = { $match: {} };
    if (filter.filterBySeatingCapacityCondition == "lte" && filter.filterBySeatingCapacity) {
      filterBySeatCapacity = {
        $match: {
          "theaterSitting": { $lte: parseFloat(filter.filterBySeatingCapacity) }
        },
      };
    }
    if (filter.filterBySeatingCapacityCondition == "gte" && filter.filterBySeatingCapacity) {
      filterBySeatCapacity = {
        $match: {
          "theaterSitting": { $gte: parseFloat(filter.filterBySeatingCapacity) }
        },
      };
    }
    let filterByMinGuarantee = { $match: {} };
    if (filter.filterByMinGuaranteeCondition === 'lte' && filter.filterByMinGuarantee) {
      filterByMinGuarantee = {
        $match: {
          'minRevenue': { '$lte': parseFloat(filter.filterByMinGuarantee) }
        },
      };
    }
    if (filter.filterByMinGuaranteeCondition === 'gte' && filter.filterByMinGuarantee) {
      filterByMinGuarantee = {
        $match: {
          'minRevenue': { '$gte': parseFloat(filter.filterByMinGuarantee) }
        },
      };
    }
    let subarea = { $match: {} };
    if (filter.filterBySubareaIds) {
      let subareaArr = [];
      subareaArr = filter.filterBySubareaIds.split(",");
      let areaArr = [];
      for (let i = 0; i < subareaArr.length; i++) {
        const obj = ObjectId(subareaArr[i]);
        areaArr.push(obj);
      }

      if (areaArr) {
        subarea = {
          $match: {
            "subareaid": { '$in': areaArr }
          },
        }
      }
    }
    let cityFilter = { $match: {} };
    if (filter.filterByCities) {
      let citiesArr = [];
      citiesArr = filter.filterByCities.split(",");
      let citiesArray = [];
      for (let i = 0; i < citiesArr.length; i++) {
        const obj = citiesArr[i];
        citiesArray.push(obj);
      }

      if (citiesArray) {
        cityFilter = {
          $match: {
            "citycode": { '$in': citiesArray }
          },
        }
      }
    }
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { $or: [filter.query] }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'ownerId',
                foreignField: '_id',
                as: 'venueownerdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'created_by',
                foreignField: '_id',
                as: 'createduserdata',
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'updated_by',
                foreignField: '_id',
                as: 'updateduserdata',
              },
            },
            {
              $lookup: {
                from: 'slots',
                localField: 'slot',
                foreignField: '_id',
                as: 'slotdata',
              },
            },
            {
              $lookup: {
                from: 'subareaes',
                localField: 'subareaid',
                foreignField: '_id',
                as: 'subareadata',
              },

            },
            {
              $lookup: {
                from: 'postavailabilities',
                localField: '_id',
                foreignField: 'venueId',
                as: 'slotfilterdata',
              },


            },

            updatedBySearch,
            createdBySearch,
            category,
            propertyType,
            filterByPrice,
            filterByCapacity,
            foodType,
            updatedBySlot,
            updatedBySlotDate,
            updatedByOnlyDate,
            subarea,
            cityFilter,
            filterBySeatCapacity,
            filterByMinGuarantee
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {

    const copyFilter = { ...filter };
    copyFilter.query = {};
    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByVenueIds) {
      const venueIdStr = copyFilter.filterByVenueIds;
      var venueId = [];
      venueId = venueIdStr.split(",");
      var objectstr = [];
      for (var i = 0; i < venueId.length; i++) {
        var obj = new ObjectId(venueId[i]);
        objectstr.push(obj);
      }
      //console.log(objectstr);
      copyFilter.query = { _id: { '$in': objectstr } };
    }

    if(copyFilter.filterByMetaUrl){
      copyFilter.query.metaUrl = {$eq: copyFilter.filterByMetaUrl}
    }

    if (copyFilter.filterByvenueId) {
      copyFilter.query._id = { $eq: ObjectId(copyFilter.filterByvenueId) };
    }


    if (copyFilter.filterByAssured) {
      copyFilter.query.assured = { $eq: JSON.parse(copyFilter.filterByAssured) };
    }

    if (copyFilter.filterByGoogleRating) {
      copyFilter.query.googleRating = { $eq: JSON.parse(copyFilter.filterByGoogleRating) };
    }

    if (copyFilter.filterByEasyVenueRating) {
      copyFilter.query.eazyVenueRating = { $eq: JSON.parse(copyFilter.filterByEasyVenueRating) };
    }


    if (copyFilter.filterByFeatured) {
      copyFilter.query.featured = { $eq: JSON.parse(copyFilter.filterByFeatured) };
    }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByAssured) {
      copyFilter.query.assured = { $eq: JSON.parse(copyFilter.filterByAssured) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if (copyFilter.filterByName) {
      copyFilter.query.name = { $regex: copyFilter.filterByName, $options: 'i' };
    }
    if (copyFilter.filterByMobile) {
      //copyFilter.query['mobileNumber'] = { $regex: copyFilter.filterByMobile, $options: '-i' };
      copyFilter.query['mobileNumber'] = { $eq: copyFilter.filterByMobile };
    }
    if (copyFilter.filterByemail) {
      copyFilter.query.email = { $regex: copyFilter.filterByemail, $options: 'i' };
    }
    if (copyFilter.filterByCountryName) {
      copyFilter.query['countryname'] = { $regex: copyFilter.filterByCountryName, $options: 'i' };
    }
    if (copyFilter.filterByStateName) {
      copyFilter.query['statename'] = { $regex: copyFilter.filterByStateName, $options: 'i' };
    }
    if (copyFilter.filterByCityName) {
      copyFilter.query['cityname'] = { $regex: copyFilter.filterByCityName, $options: 'i' };
    }
    if (copyFilter.filterByZipcode) {
      copyFilter.query['zipcode'] = { $eq: copyFilter.filterByZipcode };
    }

    if (copyFilter.filterBySwimmingPool) {
      copyFilter.query.isSwimmingPool = { $eq: JSON.parse(copyFilter.filterBySwimmingPool) };
    }

    if (copyFilter.filterByParking) {
      copyFilter.query.isParking = { $eq: JSON.parse(copyFilter.filterByParking) };
    }

    if (copyFilter.filterByAc) {
      copyFilter.query.isAC = { $eq: JSON.parse(copyFilter.filterByAc) };
    }

    if (copyFilter.filterByGreenRooms) {
      copyFilter.query.isGreenRooms = { $eq: JSON.parse(copyFilter.filterByGreenRooms) };
    }

    if (copyFilter.filterByPowerBackup) {
      copyFilter.query.isPowerBackup = { $eq: JSON.parse(copyFilter.filterByPowerBackup) };
    }

    if (copyFilter.filterByDj) {
      copyFilter.query.isDJ = { $eq: JSON.parse(copyFilter.filterByDj) };
    }

    if (copyFilter.filterByEntertainmentLicense) {
      copyFilter.query.isEntertainmentLicense = { $eq: JSON.parse(copyFilter.filterByEntertainmentLicense) };
    }


    if (copyFilter.filterByPrivateParties) {
      copyFilter.query.isPrivateParties = { $eq: JSON.parse(copyFilter.filterByPrivateParties) };
    }

    if (copyFilter.filterByWaiterService) {
      copyFilter.query.isWaiterService = { $eq: JSON.parse(copyFilter.filterByWaiterService) };
    }

    if (copyFilter.filterByVIPSection) {
      copyFilter.query.isVIPSection = { $eq: JSON.parse(copyFilter.filterByVIPSection) };
    }

    if (copyFilter.filterByRooms) {
      copyFilter.query.isRooms = { $eq: JSON.parse(copyFilter.filterByRooms) };
    }

    if (copyFilter.filterByPillarFree) {
      copyFilter.query.isPillarFree = { $eq: JSON.parse(copyFilter.filterByPillarFree) };
    }

    return copyFilter;
  }
}

module.exports = VenueRepository;
