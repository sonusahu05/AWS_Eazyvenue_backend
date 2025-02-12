const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');

class SlotRepository extends BaseRepository {
  constructor() {
    super('slots');
  }

  findBySlot(slot) {
    console.log('slot', slot)
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ slot }));
  }

  findByslotByTrainer(slot) {

    // let search = {
    //   "trainerId": {$eq: ObjectID(trainerid)},
    //   "startTime.hours": {$eq: slot.startTime.hours},
    //   "startTime.minutes": {$eq: slot.startTime.minutes},
    //   "startDate": {$eq: ISODate(slot.startDate)},
    //   "endDate": {$eq: ISODate(slot.endDate)}
    // };
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        //.find({ "trainerId" : { $eq: ObjectID(slot.trainerId)}})
        .find({
          "enduserId": { $eq: slot.enduserId },
          "startTime.hours": { $gte: slot.startTime.hours, $lte: slot.endTime.hours },
        })
        .toArray());
  }

  findById(id) {
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { _id: ObjectID(id) }
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
                localField: 'enduserId',
                foreignField: '_id',
                as: 'enduserdata',
              },
            }
          ]);
        return data.toArray();
      });
  }

  listFiltered(filter1) {

    const filter = this._getListFilter(filter1);
    //console.log(filter);
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
        $match: { "updateduserdata.fullName": { $regex: filter.filterByUpdatedby, $options: '-i' } },
      };
    }
    var createdBySearch = { $match: {} };
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
        $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: '-i' } },
      };
    }
    var enduserWiseSearch = { $match: {} };
    if (typeof filter.filterByEnduser !== 'undefined') {
      enduserWiseSearch = {
        $match: { "enduserdata.fullName": { $regex: filter.filterByEnduser, $options: '-i' } },
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
                localField: 'enduserId',
                foreignField: '_id',
                as: 'enduserdata',
              },
            },
            updatedBySearch,
            createdBySearch,
            dateSearch,
            enduserWiseSearch
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

  getCountFiltered(filter) {
    // const listFilter = this._getListFilter(filter);
    // return super.getCountFiltered(listFilter);
    const listFilter = this._getListFilter(filter);
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
        $match: { "updateduserdata.fullName": { $regex: filter.filterByUpdatedby, $options: '-i' } },
      };
    }
    var createdBySearch = { $match: {} };
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
        $match: { "createduserdata.fullName": { $regex: filter.filterByCreatedby, $options: '-i' } },
      };
    }
    var enduserWiseSearch = { $match: {} };
    if (typeof filter.filterByEnduser !== 'undefined') {
      enduserWiseSearch = {
        $match: { "enduserdata.fullName": { $regex: filter.filterByEnduser, $options: '-i' } },
      };
    }
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { $or: [listFilter.query] }
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
                localField: 'enduserId',
                foreignField: '_id',
                as: 'enduserdata',
              },
            },
            updatedBySearch,
            createdBySearch,
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByEnduserId) {
      copyFilter.query = { enduserId: { '$eq': ObjectID(copyFilter.filterByEnduserId) } };
    }

    if (copyFilter.filterBySlot) {
      copyFilter.query['slot'] = { $regex: copyFilter.filterBySlot, $options: '' };
    }
    if (copyFilter.filterByDescription) {
      copyFilter.query['description'] = { $regex: copyFilter.filterByDescription, $options: '' };
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
    if (copyFilter.filterByUpdatedAt) {
      let fromdate = new Date(copyFilter.filterByUpdatedAt);
      let nextDayDate = new Date(copyFilter.filterByUpdatedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['updated_at'] = { $gt: fromdate, $lt: nextDayDate };
    }
    return copyFilter;
  }
}

module.exports = SlotRepository;
