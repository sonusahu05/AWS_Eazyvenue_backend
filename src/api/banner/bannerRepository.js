const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');
var moment = require('moment');
class BannerRepository extends BaseRepository {
  constructor() {
    super('banners');
  }

  checkDuplicateBanner(banner) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({
          "slug": { $eq: banner.slug },
          //"disable":{$eq: false}
        })
        .toArray());
  }
  findById(id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { _id: ObjectID(id) } },
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
              as: 'createdby',
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

  findAllUsersByEmail(email) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .find({ email })
        .toArray());
  }

  listFiltered(filter) {
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
            updatedBySearch,
            createdBySearch,
          ])
          .sort({ _id: -1 });
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
            updatedBySearch,
            createdBySearch,
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };

    if (copyFilter.filterByrollId) {
      copyFilter.query = { role: { '$eq': ObjectID(copyFilter.filterByrollId) } };
    } else {
      copyFilter.query = {};
    }
    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByBannerTitle) {
      copyFilter.query.banner_title = { $regex: copyFilter.filterByBannerTitle, $options: 'i' };
    }
    if (copyFilter.filterBySlug) {
      copyFilter.query.slug = { $regex: copyFilter.filterBySlug, $options: 'i' };
    }
    if (copyFilter.filterByBannerUrl) {
      copyFilter.query.banner_url = { $regex: copyFilter.filterByBannerUrl, $options: 'i' };
    }
    if (copyFilter.filterByBannerContent) {
      copyFilter.query['banner_content'] = { $regex: copyFilter.filterByBannerContent, $options: 'i' };
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

  // TODO: implement photo return
  getBannerImage(BannerId) {
    const defaultFileName = 'default-img.jpg';
    return Promise.resolve(defaultFileName);
  }
}

module.exports = BannerRepository;
