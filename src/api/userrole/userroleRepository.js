const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');

class UserroleRepository extends BaseRepository {
  constructor() {
    super('userroles');
  }

  findByRoleName(user_role_name) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ user_role_name }));
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
    //return super.listFiltered(filter);
    var dateSearch={ $match:{}};
    
    if(typeof filter.filterByStartDate !="undefined" && typeof filter.filterByEndDate !="undefined") {
      let startdate = new Date(filter.filterByStartDate);
      let enddate = new Date(filter.filterByEndDate);
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
    }
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
                  },
                  updatedBySearch,
                  createdBySearch,
                  dateSearch
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

  getCountFiltered(filter) {
    // const listFilter = this._getListFilter(filter);
    // return super.getCountFiltered(listFilter);
    const listFilter = this._getListFilter(filter);
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
                ])
                .sort({_id: -1});
          return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};
     // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByroleName) {
      var str= copyFilter.filterByroleName+"$";
      copyFilter.query.user_role_name = { $regex: str };
    }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }

    if (copyFilter.filterByDisable) {
      copyFilter.query['disable'] = { $eq: JSON.parse(copyFilter.filterByDisable) };
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
    // if (copyFilter.filterByModule) {
    //   copyFilter.query['permissions.module'] = { $regex: copyFilter.filterByModule, $options: '-i' };
    // }
    return copyFilter;
  }
}

module.exports = UserroleRepository;
