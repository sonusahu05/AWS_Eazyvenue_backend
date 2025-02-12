const jwt = require('jsonwebtoken');
const config = require('config');
const BaseRepository = require('../../../db/baseRepository');
const RoleRepository = require('./roleRepository');

class RoleService {
  constructor() {
    this.repository = new RoleRepository();
  }

  addMany(roles) {
    return this.repository.addMany(roles);
  }  
  
  addRole(role) {
    return this.repository.add(role);
  }

  getAll(){
    return this.repository.list();
  }

  updateRole(id, roleData) {
    //console.log(userData);
    return this.repository.edit(id, roleData);
  }

  findByRoleName(user_role_name) {
    return this.repository.getRoleByName(user_role_name);
    // return Promise.all([
    //   this.repository.listFiltered(user_role_name)
    //   ])
    //   .then(([data]) => {
    //       return {
    //           items: data.map(item => this.mapUserroleToDto(item))                    
    //       };
    //   });
  }

  mapUserroleToDto(userrole) {
    return userrole ? {
      id: userrole._id,
      user_role_name: userrole.user_role_name,
      user_role_description: userrole.user_role_description,
      status: userrole.status
    } : {};
  }

}
module.exports = RoleService;
