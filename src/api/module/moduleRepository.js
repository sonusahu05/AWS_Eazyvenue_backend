const { ObjectID } = require('mongodb');
const BaseRepository = require('../../db/baseRepository');

class ModuleRepository extends BaseRepository {
  constructor() {
    super('modules');
  }

  findByModuleName(modulename) {
    return this.dbClient
      .then(db => db
        .collection(this.collection)
        .findOne({ module : modulename}));
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
    if (copyFilter.filterBymodule) {
      copyFilter.query.module = { $regex: copyFilter.filterBymodule, $options: '-i' };
    }
    if (copyFilter.filterByStatus) {
      copyFilter.query.status = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if (copyFilter.filterByDisable) {
      copyFilter.query.disable = { $eq: JSON.parse(copyFilter.filterByDisable) };
    }
    if (copyFilter.filterByLevel) {
        copyFilter.query.level = { $regex: copyFilter.filterByLevel, $options: '-i' };
    }
    if (copyFilter.filterByModule) {
      copyFilter.query['permissions.module'] = { $regex: copyFilter.filterByModule, $options: '-i' };
    }
    return copyFilter;
  }
}

module.exports = ModuleRepository;
