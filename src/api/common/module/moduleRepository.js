/*
 * Copyright (c) Akveo 2019. All Rights Reserved.
 * Licensed under the Single Application / Multi Application License.
 * See LICENSE_SINGLE_APP / LICENSE_MULTI_APP in the 'docs' folder for license information on type of purchased license.
 */

const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');

class ModuleRepository extends BaseRepository {
  constructor() {
    super('modules');
  }

  findById(id) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .aggregate([
          { $match: { _id: ObjectID(id) } },
          {
            $lookup: {
              from: 'settings',
              localField: '_id',
              foreignField: '_id',
              as: 'settings',
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

  changePassword(id, salt, passwordHash) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .updateOne({ _id: ObjectID(id) }, { $set: { salt, passwordHash } }));
  }

  listFiltered(filter) {
    const listFilter = this._getListFilter(filter);

    return super.listFiltered(listFilter);
  }

  getCountFiltered(filter) {
    const listFilter = this._getListFilter(filter);

    return super.getCountFiltered(listFilter);
  }

  _getListFilter(filter) {
    const copyFilter = { ...filter };

    copyFilter.query = {};

    // names here are not fully consistent with naming convention for compatibility with ng2-smart-table api on UI
    if (copyFilter.filterByfirstName) {
      copyFilter.query.firstName = { $regex: copyFilter.filterByfirstName, $options: '-i' };
    }
    if (copyFilter.filterBylastName) {
      copyFilter.query.lastName = { $regex: copyFilter.filterBylastName, $options: '-i' };
    }
    if (copyFilter.filterBylogin) {
      copyFilter.query.fullName = { $regex: copyFilter.filterBylogin, $options: '-i' };
    }
    if (copyFilter.filterByemail) {
      copyFilter.query.email = { $regex: copyFilter.filterByemail, $options: '-i' };
    }
    if (copyFilter.filterByage) {
      copyFilter.query.age = copyFilter.filterByage;
    }
    if (copyFilter.filterBystreet) {
      copyFilter.query['address.street'] = { $regex: copyFilter.filterBystreet, $options: '-i' };
    }
    if (copyFilter.filterBycity) {
      copyFilter.query['address.city'] = { $regex: copyFilter.filterBycity, $options: '-i' };
    }
    if (copyFilter.filterByzipcode) {
      copyFilter.query['address.zipCode'] = { $regex: copyFilter.filterByzipcode, $options: '-i' };
    }

    return copyFilter;
  }

  // TODO: implement photo return
  getPhoto(userId) {
    const defaultFileName = 'default-img.jpg';

    return Promise.resolve(defaultFileName);
    // return this.dbClient
    //   .then(db => db
    //     .collection(this.collection)
    //   )
  }
}

module.exports = ModuleRepository;
