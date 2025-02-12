const { ObjectId } = require("mongodb");
const BaseRepository = require("../../db/baseRepository");

class VendorRepository extends BaseRepository{
    constructor(){
        super('vendors')
    }

    //all get mongo calls
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
         
    
    
        var createdBySearch = { $match: {} };
        if (typeof filter.filterByCreatedby !== 'undefined') {
          createdBySearch = {
            $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: '-i' } },
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
                    as: 'vendorownerdata',
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
                
    
                updatedBySearch,
                createdBySearch,
                 
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

module.exports = VendorRepository;
