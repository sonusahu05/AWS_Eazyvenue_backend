const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class WishlistRepository extends BaseRepository {
  constructor() {
    super('wishlists');
  }
  findByWishlist(Wishlist) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({
          "venueId": { $eq: ObjectId(Wishlist.venueId) },
          "customerId": { $eq: ObjectId(Wishlist.customerId) },
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
                from: 'users',
                localField: 'customerId',
                foreignField: '_id',
                as: 'customerdata',
              },
            },
            {
              $lookup: {
                from: 'venues',
                localField: 'venueId',
                foreignField: '_id',
                as: 'venuedata',
              },
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categorydata',
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "vendors.id",
                foreignField: "_id",
                as: "vendordata"
              }
            },
            {
              $lookup: {
                from: "categories",
                localField: "foodType.slug",
                foreignField: "slug",
                as: "foodTypedata"
              }
            },
            {
              $lookup: {
                from: "categories",
                localField: "foodMenuType.slug",
                foreignField: "slug",
                as: "foodmenudata"
              }
            },
            {
              $lookup: {
                from: "postavailabilities",
                localField: "duration.postavailabilityId",
                foreignField: "_id",
                as: "postavailabilitiesdata"
              }
            }
          ]);
        return data.toArray();
      });
  }

  listFiltered(filter1) {
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
        $match: { "updateduserdata.fullName": { $regex: filter.filterByUpdatedby, $options: 'i' } },
      };
    }
    var createdBySearch = { $match: {} };
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
        $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: 'i' } },
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
                from: 'users',
                localField: 'customerId',
                foreignField: '_id',
                as: 'customerdata',
              },
            },
            {
              $lookup: {
                from: 'venues',
                localField: 'venueId',
                foreignField: '_id',
                as: 'venuedata',
              },
            },
            updatedBySearch,
            createdBySearch,
            dateSearch
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
            }
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
    if (copyFilter.filterByCustomerId) {
      copyFilter.query.customerId = { $eq: ObjectId(copyFilter.filterByCustomerId) };
    }
    if (copyFilter.filterByOrderType) {
      copyFilter.query.orderType = { $eq: copyFilter.filterByOrderType };
    }
    if (copyFilter.filterByFirstName) {
      copyFilter.query.firstName = { $regex: copyFilter.filterByFirstName, $options: 'i' };
    }
    if (copyFilter.filterByLastName) {
      copyFilter.query.lastName = { $regex: copyFilter.filterByLastName, $options: 'i' };
    }
    if (copyFilter.filterByEmail) {
      copyFilter.query.email = { $regex: copyFilter.filterByEmail, $options: 'i' };
    }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }

    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    return copyFilter;
  }
}

module.exports = WishlistRepository;
