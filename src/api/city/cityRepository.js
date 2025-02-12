const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class CityRepository extends BaseRepository {
  constructor() {
    super('cities');
  }

  findByCityName(name) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ name }));
  }

  findByCityList(cityList){
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({name: {$in: cityList}})
        .toArray()
        )
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
    var countryNameSearch={ $match:{}};
    if (typeof filter1.filterByCountryName !== 'undefined') {
      countryNameSearch = {
          $match:{"countrydata.name":{ $regex: filter1.filterByCountryName, $options: 'i' }},
        };
    }
    var countryCodeSearch={ $match:{}};
    if (typeof filter1.filterByCountryCode !== 'undefined') {
      countryCodeSearch = {
          $match:{"countrydata.code":{ $regex: filter1.filterByCountryCode, $options: 'i' }},
        };
    }
    var stateNameSearch={ $match:{}};
    if (typeof filter1.filterByStateName !== 'undefined') {
      stateNameSearch = {
          $match:{"statedata.name":{ $regex: filter1.filterByStateName, $options: 'i' }},
        };
    }
    var stateCodeSearch={ $match:{}};
    if (typeof filter1.filterByStateCode !== 'undefined') {
      stateCodeSearch = {
          $match:{"statedata.state_code":{ $regex: filter1.filterByStateCode, $options: 'i' }},
        };
    }
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {$or : [ filter.query]}
                  },   
                  {
                    $lookup: {
                      'from': 'countries', 
                      'localField': 'country_id', 
                      'foreignField': 'id', 
                      'as': 'countrydata'
                    }
                  },  
                  {
                    $lookup: {
                      from: 'states',
                      localField: 'state_id',
                      foreignField: 'id',
                      as: 'statedata',
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
                  countryNameSearch,
                  countryCodeSearch,
                  stateNameSearch,
                  stateCodeSearch                    
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
    var countryNameSearch={ $match:{}};
    if (typeof filter1.filterByCountryName !== 'undefined') {
      countryNameSearch = {
          $match:{"countrydata.name":{ $regex: filter1.filterByCountryName, $options: 'i' }},
        };
    }
    var countryCodeSearch={ $match:{}};
    if (typeof filter1.filterByCountryCode !== 'undefined') {
      countryCodeSearch = {
          $match:{"countrydata.code":{ $regex: filter1.filterByCountryCode, $options: 'i' }},
        };
    }
    var stateNameSearch={ $match:{}};
    if (typeof filter1.filterByStateName !== 'undefined') {
      stateNameSearch = {
          $match:{"statedata.name":{ $regex: filter1.filterByStateName, $options: 'i' }},
        };
    }
    var stateCodeSearch={ $match:{}};
    if (typeof filter1.filterByStateCode !== 'undefined') {
      stateCodeSearch = {
          $match:{"statedata.state_code":{ $regex: filter1.filterByStateCode, $options: 'i' }},
        };
    }
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {$or : [ filter.query]}
                  },
                  {
                    $lookup: {
                      'from': 'countries', 
                      'localField': 'country_id', 
                      'foreignField': 'id', 
                      'as': 'countrydata'
                    }
                  },  
                  {
                    $lookup: {
                      from: 'states',
                      localField: 'state_id',
                      foreignField: 'id',
                      as: 'statedata',
                    },
                  },     
                  countryNameSearch,
                  countryCodeSearch,
                  stateNameSearch,
                  stateCodeSearch  
                ])
                .sort({_id: -1});
          return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
    
    if (copyFilter.filterByName) {
      copyFilter.query.name = { $regex: copyFilter.filterByName, $options: 'i' };
    }    
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if(copyFilter.filterByStateId) {
      //copyFilter.query = {state_id: {'$eq': ObjectID(copyFilter.filterByStateId)}};
      copyFilter.query.state_id = {'$eq': parseInt(copyFilter.filterByStateId)};
    }
    return copyFilter;
  }
}

module.exports = CityRepository;
