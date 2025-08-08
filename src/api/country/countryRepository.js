const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class CountryRepository extends BaseRepository {
  constructor() {
    super('countries');
  }

  findById(id){
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {_id: ObjectID(id) }
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
                ]);
            return data.toArray();
      });
  }

  listFiltered(filter1) {        
    const filter = this._getListFilter(filter1);
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {$or : [ filter.query]}
                  },                  
                                 
                ])
                .sort({_id: -1});
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
                    $match: {$or : [ filter.query]}
                  },
                ])
                .sort({_id: -1});
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
    if (copyFilter.filterByCountryCode) {
      copyFilter.query.country_code = { $eq: copyFilter.filterByCountryCode };
    }
    return copyFilter;
  }
}

module.exports = CountryRepository;
