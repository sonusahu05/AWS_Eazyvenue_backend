const jwt = require('jsonwebtoken');
const config = require('config');

const ModuleRepository = require('./moduleRepository');

class ModuleService {
  constructor() {
    this.repository = new ModuleRepository();
  }

  addMany(modules) {
    return this.repository.addMany(modules);
  }

  findByModule(moduleName) {
    return this.repository.dbClient
      .then(db => db
        .collection('modules')
        .find({ module: moduleName })
        .toArray());
  }
}

module.exports = ModuleService;
