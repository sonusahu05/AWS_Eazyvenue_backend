const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');

class CommonRepository extends BaseRepository {
  constructor() {
    super('cities');
  }

  addMany(items, collection) {
    return this.dbClient
        .then(db => db
        .collection(collection)
        .insertMany(items));
  }
  getCityByname(cityname){    
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          //{ $match: { $and : [{state_code: statecode}, { country_code: countrycode }] } }
          { $match: { name: cityname}}
        ])
        .toArray())
      .then(data => data);
  }

  findByStatecode(stateid){    
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          //{ $match: { $and : [{state_code: statecode}, { country_code: countrycode }] } }
          { $match: { state_id: parseInt(stateid)}}
        ])
        .toArray())
      .then(data => data);
  }

  findByCountrycode(countrycode){        
    return this.dbClient
      .then(db => db
        .collection("states")
        .aggregate([
          { $match: { country_code: countrycode } }
        ])
        .toArray())
      .then(data => data);
  }

  getCurrencyList(){    
    return this.dbClient
      .then(db => db
        .collection("countries")
        .aggregate([
          {$group: { _id: {"currency": "$currency", "currency_symbol":"$currency_symbol" }}}
        ])
        //.find()
        .toArray());
  }
  getCountryList(){    
    return this.dbClient
      .then(db => db
        .collection("countries")
        .find()
        .toArray());
  }

  getTimezoneList(){    
    // return this.dbClient
    //   .then(db => db
    //     .collection("countries")
    //     .distinct("timezones.zoneName"))
    //     .then(data => data);
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    '$unwind': {
                      'path': '$timezones'
                    }
                  }, {
                    '$group': {
                      '_id': null,
                      'timezonelist': { 
                        $addToSet: { 'zoneName': '$timezones.zoneName', 'gmtOffsetName' : '$timezones.gmtOffsetName'} 
                      }
                    }
                  }
                  //{ $project: {Package: 1, deps: {'$setUnion': '$timezones.zoneName'}}}
                ]).cursor();           
            return data;
      });  
    // return this.dbClient
    //         .then(db => {
    //             const data = db.collection(this.collection)
    //             .aggregate([
    //               { $group: {_id:{zoneName:'$zoneName', gmtOffsetName:'$gmtOffsetName'}}},
    //               { $project: { _id: 0 }}]);
    //         return data.toArray();
    //   });   
  }
}

module.exports = CommonRepository;
