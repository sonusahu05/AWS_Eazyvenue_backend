const { ObjectId } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories');
  }

  findByCategoryName(name) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ name }));
  }

  getCategoryBySlug(slug) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({ "slug": { $eq: slug } })
        .toArray());
  }

  getCategoriesByParentId(id){
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({parent: ObjectId(id)})
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
                from: 'categories',
                localField: 'parent',
                foreignField: '_id',
                as: 'parentcategorydata',
              },
            },
          ]);
        return data.toArray();
      });
  }

  getAllCategory(params) {
    const filter = this._getListFilter(params);
    var getParent = { $match: { "parent": { $eq: null } } };
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: { $or: [filter.query] }
            },
            getParent
          ])
          .sort({ _id: -1 });

        return data.toArray();
      });
  }
  getParentwiseChildCategory() {
    return this.dbClient
      .then(db => {
        const data = db.collection(this.collection)
          .aggregate([
            {
              $match: {
                'status': true,
                'disable': false
              }
            }, {
              '$sort': {
                'parent': 1
              }
            }, {
              '$group': {
                '_id': '$parent',
                'subCategory': {
                  '$push': '$$ROOT'
                }
              }
            }, {
              '$lookup': {
                'from': 'categories',
                'localField': 'subCategory.parent',
                'foreignField': '_id',
                'as': 'parentCategory'
              }
            },
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  listFiltered(filter1) {
    const filter = this._getListFilter(filter1);
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
    var searchByParent = { $match: {} };
    if (typeof filter.filterByParentCategory !== 'undefined') {
      searchByParent = {
        $match: { "parentcategorydata.name": { $regex: filter.filterByParentCategory, $options: 'i' } },
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
                from: 'categories',
                localField: 'parent',
                foreignField: '_id',
                as: 'parentcategorydata',
              },
            },
            updatedBySearch,
            createdBySearch,
            searchByParent,
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

  getCountFiltered(filter) {
    const listFilter = this._getListFilter(filter);
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
    var searchByParent = { $match: {} };
    if (typeof filter.filterByParentCategory !== 'undefined') {
      searchByParent = {
        $match: { "parentcategorydata[0].name": { $regex: filter.filterByParentCategory, $options: 'i' } },
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
                from: 'categories',
                localField: 'parent',
                foreignField: '_id',
                as: 'parentcategorydata',
              },
            },
            updatedBySearch,
            createdBySearch,
            searchByParent
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};

    if (copyFilter.filterByname) {
      copyFilter.query.name = { $regex: copyFilter.filterByname, $options: 'i' };
    }
    if (copyFilter.filterBySlug) {
      copyFilter.query.slug = { $regex: copyFilter.filterBySlug, $options: 'i' };
    }
    if (copyFilter.filterBySlug) {
      copyFilter.query.slug = { $regex: copyFilter.filterBySlug, $options: 'i' };
    }
    
    if (copyFilter.filterByCategoryIds) {
      const categoriesIdStr = copyFilter.filterByCategoryIds;
      var categoriesId = [];
      categoriesId = categoriesIdStr.split(",");
      var objectstr = [];
      for (var i = 0; i < categoriesId.length; i++) {
        var obj = new ObjectId(categoriesId[i]);
        objectstr.push(obj);
      }
      copyFilter.query = { _id: { '$in': objectstr } };
    }
    if(copyFilter.getOnlyParent) {
      copyFilter.query.parent = { $eq: null };
    }

    if(copyFilter.getSubcategory) {
      copyFilter.query.parent = { $ne: null };
      }

    if (copyFilter.filterByParent) {            
      copyFilter.query.parent = { $eq: ObjectId(copyFilter.filterByParent) };
    }



    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByStatus) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query['disable'] = { $eq: JSON.parse(copyFilter.filterByDisable) };
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
module.exports = CategoryRepository;