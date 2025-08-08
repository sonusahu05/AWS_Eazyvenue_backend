const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');

class OfferRepository extends BaseRepository {
  constructor() {
    super('offers');
  }

  findByOfferName(name) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ name }));
  }

  listFiltered(filter1) {
    const filter = this._getListFilter(filter1);
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
                from: "categories",
                localField: "occasion.id",
                foreignField: "_id",
                as: "occasion"
              }
            },

            {
              $lookup: {
                from: "cities",
                localField: "city.id",
                foreignField: "_id",
                as: "city"
              }
            },

            {
              $lookup: {
                from: "subareaes",
                localField: "subarea.id",
                foreignField: "_id",
                as: "subarea"
              }
            },

            {
              $lookup: {
                from: "venues",
                localField: "venue.id",
                foreignField: "_id",
                as: "venue"
              }
            },
            {
              $lookup: {
                from: "categories",
                localField: "assign_offer_to.id",
                foreignField: "_id",
                as: "assign_offer_to"
              }
            },

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

  getCountFiltered(filter1) {
    const filter = this._getListFilter(filter1);
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
                from: "categories",
                localField: "occasion.id",
                foreignField: "_id",
                as: "occasion"
              }
            },

            {
              $lookup: {
                from: "cities",
                localField: "city.id",
                foreignField: "_id",
                as: "city"
              }
            },

            {
              $lookup: {
                from: "subareaes",
                localField: "subarea.id",
                foreignField: "_id",
                as: "subarea"
              }
            },

            {
              $lookup: {
                from: "venues",
                localField: "venue.id",
                foreignField: "_id",
                as: "venue"
              }
            },
            {
              $lookup: {
                from: "categories",
                localField: "assign_offer_to.id",
                foreignField: "_id",
                as: "assign_offer_to"
              }
            }
          ])
          .sort({ _id: -1 });
        return data.toArray();
      });
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };
    copyFilter.query = {};

    if (copyFilter.filterByTitle) {
      copyFilter.query.title = { $regex: copyFilter.filterByTitle, $options: 'i' };
    }
    if (copyFilter.filterByCode) {
      copyFilter.query.code = { $regex: copyFilter.filterByCode, $options: 'i' };
    }
    if (copyFilter.filterByDescription) {
      copyFilter.query.description = { $regex: copyFilter.filterByDescription, $options: 'i' };
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

module.exports = OfferRepository;
