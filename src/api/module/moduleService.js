const { ObjectID } = require('mongodb');
//const BaseRepository = require('../../db/baseRepository');
const ModuleRepository = require('./moduleRepository');

class ModuleService{
  constructor() {
    this.repository = new ModuleRepository();
  }

  addModule(module) {
    //return this.repository.add(module);
    //console.log(module.module);
    return this.repository.findByModuleName(module.module).then((existingModule) => {
        if (existingModule) {
            throw new Error('Module already exists');
        }
        return this.repository.add(module);
    })
}  

  list(filter) {
    return Promise.all([
        this.repository.listFiltered(filter),
        this.repository.getCountFiltered(filter),
        ])
        .then(([data, count]) => {
            return {
                totalCount: count,
                items: item                    
            };
        });
}

  findById(id) {
    return this.repository.findById(id);
  }

  edit(id, data) {
    //return this.repository.edit(id, data);
    return this.repository.findById(id).then((existingModule) => {
      if (existingModule) {
          return this.repository.edit(id, data);
          
      } else {
        throw new Error('User Role already exists');
      }
  })
  }

  mapModuleData(dto) {
    return dto ? {
      module: dto.module,
      module_description: dto.module_description,
      level: dto.level,
      status: dto.status,
      permission: dto.permission,
      submodule: dto.submodule,
    } : {};
  }

  list(filter) {
    return Promise.all([
        this.repository.listFiltered(filter),
        this.repository.getCountFiltered(filter),
        ])
        .then(([data, count]) => {
            return {
                totalCount: count,
                items: data.map(item => item)                    
            };
        });
}
  addMany(users) {
    return this.dbClient.addMany(users);
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

module.exports = ModuleService;
