const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class StateRepository extends BaseRepository {
  constructor() {
    super('states');
  }

  
  findByStateName(name) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ name }));
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
              '$lookup': {
                'from': 'countries',
                'localField': 'country_id',
                'foreignField': '_id',
                'as': 'countrydata'
              }
            },
          ]);
        return data.toArray();
      });
  }

  listFiltered(filter1) {
    const listFilter = this._getListFilter(filter1);
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { $or: [listFilter.query] }
            },
            {
              '$lookup': {
                'from': 'countries',
                'localField': 'country_id',
                'foreignField': 'id',
                'as': 'countrydata'
              }
            },
          ])
          .sort({_id: -1});
          if (listFilter.pageSize && listFilter.pageNumber) {
              data
                  .skip(parseInt(listFilter.pageSize, 10) * (parseInt(listFilter.pageNumber, 10) - 1))
                  .limit(parseInt(listFilter.pageSize, 10));
          }
          if (listFilter.sortBy && listFilter.orderBy) {
              const sortSettings = { [listFilter.sortBy]: listFilter.orderBy === 'ASC' ? 1 : -1 };
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
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    return copyFilter;
  }
}

module.exports = StateRepository;
