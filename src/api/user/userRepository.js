const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  findById(id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { _id: ObjectId(id) } },
          {
            $lookup: {
              from: 'userroles',
              localField: 'role',
              foreignField: '_id',
              as: 'roledetail',
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
          { $limit: 1 },
        ])
        .toArray())
      .then(data => (data && data.length ? data[0] : data));
  }

  findByEmail(email) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ email }));
  }

  findByMobileNumber(mobileNumber) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ mobileNumber }));
  }

 

  findAllUsersByEmail(email) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({ email })
        .toArray());
  }

  listFiltered(filter) {
    const listFilter = this._getListFilter(filter);    
    var dateSearch={ $match:{}};    
    if(typeof filter.filterByStartDate !="undefined" && typeof filter.filterByEndDate !="undefined") {
      let startdate = new Date(filter.filterByStartDate);
      let enddate = new Date(filter.filterByEndDate);
      enddate.setDate(enddate.getDate() + 1);
      if(filter.filterByDate == "created_at") {
        dateSearch = {
          $match:{"created_at":{ $gte: startdate, $lte:enddate }},
        };
      }
      if(filter.filterByDate == "updated_at") {
        dateSearch = {
          $match:{"updated_at":{ $gte: startdate, $lte:enddate }},
        };
      }
      if(filter.filterByDate == "dob") {
        let fromdate = new Date(moment(filter.filterByStartDate).utc());
        let nextDayDate =new Date(moment(filter.filterByEndDate).utc());
        nextDayDate.setDate(nextDayDate.getDate() + 1);
        dateSearch = {
          $match:{"dob":{ $gte: fromdate, $lte: nextDayDate }},
        };
      }
    }
    //console.log(dateSearch);
    var updatedBySearch={ $match:{}};
    if (typeof filter.filterByUpdatedby !== 'undefined') {
        updatedBySearch = {
          $match:{"updateduserdata.fullName":{ $regex: filter.filterByUpdatedby, $options: '-i' }},
        };
    }
    var createdBySearch={ $match:{}};
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
          $match:{"createduserdata.fullName":{ $regex: filter.filterByCreatedby, $options: '-i' }},
        };
    }  
    
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {$or : [ listFilter.query]}
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
                  dateSearch
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

  
  
  getCountFiltered(filter) {
    // const listFilter = this._getListFilter(filter);
    // return super.getCountFiltered(listFilter);
    const listFilter = this._getListFilter(filter);
    var updatedBySearch={ $match:{}};
    if (typeof filter.filterByUpdatedby !== 'undefined') {
        updatedBySearch = {
          $match:{"updateduserdata.fullName":{ $regex: filter.filterByUpdatedby, $options: 'i' }},
        };
    }
    var createdBySearch={ $match:{}};
    if (typeof filter.filterByCreatedby !== 'undefined') {
      createdBySearch = {
          $match:{"createduserdata.fullName":{ $regex: filter.filterByCreatedby, $options: 'i' }},
        };
    }
    
    return this.dbClient
            .then(db => {
                const data = db.collection(this.collection)
                .aggregate([
                  {
                    $match: {$or : [ listFilter.query]}
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
                .sort({_id: -1});
          return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    if(copyFilter.filterByrollId) {
      copyFilter.query = {role: {'$eq': ObjectId(copyFilter.filterByrollId)}};
    } else {
      copyFilter.query = {};
    }
    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByFullName) {
      copyFilter.query.fullName = { $regex: copyFilter.filterByFullName, $options: 'i' };
    }
    if (copyFilter.filterByemail) {
      copyFilter.query.email = { $regex: copyFilter.filterByemail, $options: 'i' };
    }
    if (copyFilter.filterByFirstName) {
      copyFilter.query['firstName'] = { $regex: copyFilter.filterByFirstName, $options: 'i' };
    }
    if (copyFilter.filterByLastName) {
      copyFilter.query['lastName'] = { $regex: copyFilter.filterByLastName, $options: 'i' };
    }
    if (copyFilter.filterByMobile) {
      //copyFilter.query['mobileNumber'] = { $regex: copyFilter.filterByMobile, $options: 'i' };
      copyFilter.query['mobileNumber'] = { $eq: copyFilter.filterByMobile};
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
      //copyFilter.query['zipcode'] = { $regex: "/*"+copyFilter.filterByZipcode, $options: 'i' };
      //copyFilter.query['zipcode'] = { $regex: ".*"+copyFilter.filterByZipcode+".*", $options: 'i'};
      copyFilter.query['zipcode'] = { $eq: copyFilter.filterByZipcode};
    }
    // if (copyFilter.filterByExperties) {
    //   copyFilter.query.credentials.credential = { $regex: copyFilter.filterByExperties, $options: 'i' };
    // }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByGender) {
      //copyFilter.query['gender'] = { $regex: copyFilter.filterByGender, $options: 'i' };
      copyFilter.query['gender'] = { $eq: copyFilter.filterByGender};
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query['disable'] = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if (copyFilter.filterByDob) {
      
      //let fromdate = new Date(copyFilter.filterByDob);
      let fromdate = new Date(moment(copyFilter.filterByDob).utc());
      let nextDayDate =new Date(moment(copyFilter.filterByDob).utc());
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['dob'] = {$gte: fromdate, $lt: nextDayDate};
    }
    // if(copyFilter.filterByenduserId) {
    //   copyFilter.query = {enduserId: {'$eq': ObjectId(copyFilter.filterByenduserId)}};
    // }
    if(copyFilter.filterByParentUserId) {
      copyFilter.query = {parentuserId: {'$eq': ObjectId(copyFilter.filterByParentUserId)}};
    }
    if (copyFilter.filterByCreatedAt) {
      let fromdate = new Date(copyFilter.filterByCreatedAt);
      let nextDayDate = new Date(copyFilter.filterByCreatedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['created_at'] = {$gt: fromdate, $lt: nextDayDate};
    }
    if (copyFilter.filterByUpdatedAt) {
      let fromdate = new Date(copyFilter.filterByUpdatedAt);
      let nextDayDate = new Date(copyFilter.filterByUpdatedAt);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      copyFilter.query['updated_at'] = {$gt: fromdate, $lt: nextDayDate};
    }
    return copyFilter;
  }

  // TODO: implement photo return
  getPhoto(userId) {
    const defaultFileName = 'default-img.jpg';
    return Promise.resolve(defaultFileName);
  }
}

module.exports = UserRepository;
