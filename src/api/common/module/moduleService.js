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
}

module.exports = ModuleService;
