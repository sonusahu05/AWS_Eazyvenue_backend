const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class EventplannerRepository extends BaseRepository {
  constructor() {
    super('eventplanners');
  }

  findById(id){
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {_id: ObjectId(id) }
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
                .sort({_id: -1});

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
                    $match: {$or : [ filter.query]}
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
                .sort({_id: -1});
          return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
    
    if (copyFilter.filterByFirstName) {
      copyFilter.query.firstName = { $regex: copyFilter.filterByFirstName, $options: 'i' };
    }
    if (copyFilter.filterByLastName) {
      copyFilter.query.lastName = { $regex: copyFilter.filterByLastName, $options: 'i' };
    }
    if (copyFilter.filterByEmail) {
      copyFilter.query.email = { $regex: copyFilter.filterByEmail, $options: 'i' };
    }
    if (copyFilter.filterByPhoneNumber) {
      copyFilter.query.phoneNumber = { $regex: copyFilter.filterByPhoneNumber, $options: 'i' };
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

module.exports = EventplannerRepository;
