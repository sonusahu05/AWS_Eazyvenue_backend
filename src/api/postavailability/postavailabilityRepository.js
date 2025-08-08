const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');

class PostavailabilityRepository extends BaseRepository {
  constructor() {
    super('postavailabilities');
  }

  findByPostAvailability(postavailability) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({
          "venueId": { $eq: ObjectId(postavailability.venueId) },
          "slotdate": { $eq: postavailability.slotdate },
          "disable": { $eq: false },
          "slotId": { $eq: ObjectId(postavailability.slotId) }
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
                from: 'venue',
                localField: 'venueId',
                foreignField: '_id',
                as: 'venuedata',
              },
            },
            {
              $lookup: {
                from: 'slots',
                localField: 'slotId',
                foreignField: '_id',
                as: 'slotdata',
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
      let startdate = new Date(filter.filterByStartDate);
      let enddate = new Date(filter.filterByEndDate);
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
                from: 'venue',
                localField: 'venueId',
                foreignField: '_id',
                as: 'venuedata',
              },
            },
            {
              $lookup: {
                from: 'slots',
                localField: 'slotId',
                foreignField: '_id',
                as: 'slotdata',
              },
            },
            updatedBySearch,
            createdBySearch,
            dateSearch,
            //updatedByOnlyDate,
            // trainerWiseSearch,
            // trainerNameSearch
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
    if (copyFilter.filterByVenueId) {
      copyFilter.query = { venueId: { '$eq': ObjectId(copyFilter.filterByVenueId) } };
    }
    if (copyFilter.filterByName) {
      copyFilter.query.name = { $regex: copyFilter.filterByName, $options: 'i' };
    }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if (copyFilter.filterByCreatedAt) {
      let fromdate = new Date(copyFilter.filterByCreatedAt);
      let nextDayDate = new Date(copyFilter.filterByCreatedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['created_at'] = { $gt: fromdate, $lt: nextDayDate };
    }
    if (copyFilter.filterByDate) {

      let fromdate = new Date(copyFilter.filterByDate);

      let nextDayDate = new Date(copyFilter.filterByDate);

      nextDayDate.setDate(nextDayDate.getDate() + 1);

      copyFilter.query['slotdate'] = { $gt: fromdate, $lte: nextDayDate };
    }

   /// filterBySlotStartDate and filterBySlotEndDate

    if (copyFilter.filterBySlotStartDate  && copyFilter.filterBySlotEndDate) {
      let startdate = moment(copyFilter.filterBySlotStartDate).utc().toDate();

      let enddate = moment(copyFilter.filterBySlotEndDate).utc().toDate();

      copyFilter.query['slotdate'] = { $gte: startdate};
      copyFilter.query['slotenddate'] = {$lte: enddate };
    }


    if (copyFilter.filterByapproved) {
      copyFilter.query.approved = { $eq: JSON.parse(copyFilter.filterByapproved) };
    }
    if (copyFilter.filterByApprovedAt) {
      let fromdate = new Date(copyFilter.filterByApprovedAt);
      let nextDayDate = new Date(copyFilter.filterByApprovedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['approved_at'] = { $gt: fromdate, $lt: nextDayDate };
    }
    if (copyFilter.filterByUpdatedAt) {
      let fromdate = new Date(copyFilter.filterByUpdatedAt);
      let nextDayDate = new Date(copyFilter.filterByUpdatedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['updated_at'] = { $gt: fromdate, $lt: nextDayDate };
    }
    return copyFilter;
  }
}

module.exports = PostavailabilityRepository;
