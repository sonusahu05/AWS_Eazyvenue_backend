const { ObjectID } = require('mongodb');
const BaseRepository = require('../../../db/baseRepository');

class RoleRepository extends BaseRepository {
  constructor() {
    super('userroles');
  }

  // findByRoleName(user_role_name) {
  //   const listFilter = this._getListFilter(user_role_name);
  //   console.log(listFilter);
  //   return super.listFiltered(listFilter);
  // }

  //  _getListFilter(filter) {
  //   copyFilter.query = {};
  //   copyFilter.query.user_role_name = { $regex: user_role_name, $options: '-i' };
  //   return copyFilter;
  // }
  getRoleByName(user_role_name) {
    return this.dbClient
        .then(db => db
          .collection(this.collection)
          .find({"user_role_name":{ $eq: user_role_name }})
          .toArray());
  }
}

module.exports = RoleRepository;
