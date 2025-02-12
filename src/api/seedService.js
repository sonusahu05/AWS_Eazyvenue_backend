const UserService = require('./common/user/userService');
const fs = require('fs');
const ModuleService = require('./common/module/moduleService');
const CommonService = require('./common/common/commonService');
const RoleService = require('./common/role/roleService');
const CategoryService = require('./category/categoryService');
const cipher = require('./common/auth/cipherHelper');
const logger = require('../utils/logger');
const User = require('../../model/User');
const Country = require('../../model/Country');
const State = require('../../model/State');
const City = require('../../model/City');
const userService = new UserService();
const moduleService = new ModuleService();
const commonService = new CommonService();
const roleService = new RoleService();
const categoryService = new CategoryService();
const { ObjectId } = require('mongodb');
var moment = require('moment');
class SeedService {
  checkAndSeed() {
    logger.infoLog.info('Seed Data');
    userService.getCount()
      .then(async count => {
        if (!count) {
          this.seed().then();
        } else {
          //await this.addEventPlannerModules();
          // const adminUser = await userService.findByEmail('admin@admin.admin');
          // const userId = adminUser._id;
          // const role = await roleService.findByRoleName('admin');
          // const eventPlanner  = {
          //   "module": "Event Planner Management",
          //   "module_description": "Manage Event Planner",
          //   "level": 1,
          //   "status": true,
          //   "url": "/manage/eventplanner",
          //   "icon": "pi-folder-open",
          //   "permission": {
          //     "edit": true,
          //     "view": false
          //   }
          // };
          // let tmp;
          // tmp = role[0]['permissions'];
          // console.log(tmp.length);
          // let size = Object.keys(tmp).length;
          // console.log(size);

          // tmp.push(eventPlanner);
          // // let le = tmp.length;
          // // tmp={...tmp, le:eventPlanner};
          // console.log(tmp);

          // const userObj = [];
          // userObj['created_by'] = userId;
          // userObj['updated_by'] = userId;
          // userObj['updated_at'] = moment.utc().toDate();
          // userObj['permissions'] = tmp;
          // const updateData = Object.assign({}, userObj);
          // await roleService.updateRole(role[0]._id, updateData);
        }
      });
  }

  // function to add stub data for testing
  async seed() {
    try {
      logger.infoLog.info('Seed Data');
      await this.addModules();
      await this.addRole();
      let countriesData = require('./../defaultdata/countries.json');
      const country = await commonService.addMany(countriesData, "countries");
      let statesData = require('./../defaultdata/states.json');
      const states = await commonService.addMany(statesData, "states");
      let citiesData = require('./../defaultdata/cities.json');
      const city = await commonService.addMany(citiesData, "cities");
      const role = await roleService.findByRoleName('admin');
      await this.addCustomUsers(role[0]._id);
      const adminUser = await userService.findByEmail('admin@admin.admin');
      console.log('abuiv ')
      const userId = adminUser._id;
      const userObj = [];
      userObj['created_by'] = userId;
      userObj['updated_by'] = userId;
      userObj['updated_at'] = moment.utc().toDate();
      const updateData = Object.assign({}, userObj);
      await roleService.updateRole(role[0]._id, updateData);
      await this.addCategory(userId);
      await roleService.getAll().then(roles => {
        roles.forEach((doc) => {
          roleService.updateRole(doc._id, updateData);
        })
      });
      await User.updateMany({}, updateData);
      const updateObj = [];
      updateObj['created_by'] = userId;
      updateObj['updated_by'] = userId;
      updateObj['updated_at'] = moment.utc().toDate();
      updateObj['status'] = true;
      updateObj['disable'] = false;

      const updatestatecityData = Object.assign({}, updateObj);
      await Country.updateMany({}, updatestatecityData);
      await State.updateMany({}, updatestatecityData);
      await City.updateMany({}, updatestatecityData);
      await this.addSubarea(userId);
      await this.addSubcategory(userId);
      await this.addSlot(userId);
      logger.infoLog.info('Seed Users Done');
    } catch (err) {
      logger.errorLog.error(err);
    }
  }

  addEventPlannerModules() {
    const moduleToAdd = [];
    const eventPlanner = {
      "module": "Event Planner Management",
      "module_description": "Manage Event Planner",
      "level": 1,
      "status": true,
      "url": "/manage/eventplanner",
      "icon": "pi-folder-open",
      "permission": {
        "edit": true,
        "view": false
      }
    };
    moduleToAdd.push(eventPlanner);
    return moduleService.addMany(moduleToAdd);
  }
  addModules() {
    const moduleToAdd = [];
    const role = {
      "module": "Role Management",
      "module_description": "Manage Role",
      "level": 1,
      "status": true,
      "url": "/manage/role",
      "icon": "pi-folder-open",
      "permission": {
        "edit": true,
        "view": false
      }
    };
    moduleToAdd.push(role);
    // const category = {
    //   "module": "Category Management",
    //   "module_description": "Manage Category",
    //   "level": 1,
    //   "status": true,
    //   "url": "/manage/category",
    //   "icon": "pi-user-plus",
    //   "permission": {
    //     "edit": true,
    //     "view": false
    //   }
    // };
    // moduleToAdd.push(category);

    const category = {
      "module": "Category Management",
      "module_description": "Category Management",
      "level": 1,
      "url": "/manage/category",
      "icon": "pi-list",
      "status": true,
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Category",
          "module_description": "Category",
          "url": "/manage/category/category",
          "icon": "pi-list",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Sub Category",
          "module_description": "Sub Category",
          "url": "/manage/category/subcategory",
          "icon": "pi-list",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
      ]
    };
    moduleToAdd.push(category);

    const adminManagement = {
      "module": "Admin Management",
      "module_description": "Admin Management",
      "level": 1,
      "status": true,
      "url": "/manage/admin",
      "icon": "pi-user-plus",
      "permission": {
        "edit": true,
        "view": false
      },

    };
    moduleToAdd.push(adminManagement);

    const cms = {
      "module": "Content Management",
      "module_description": "Manage Content",
      "level": 1,
      "status": true,
      "url": "/manage/cmsmodule",
      "icon": "pi pi-clone",
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Content Page",
          "module_description": "Content Page",
          "url": "/manage/cmsmodule",
          "icon": "pi-clone",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },]

    };
    moduleToAdd.push(cms);

    const venue = {
      "module": "Venue Management",
      "module_description": "Manage Venue",
      "level": 1,
      "status": true,
      "url": "/manage/venue",
      "icon": "pi-clone",
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Venue",
          "module_description": "Venue",
          "url": "/manage/venue",
          "icon": "pi-clone",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Venue Slot Management",
          "module_description": "Venue Slot Management",
          "url": "/manage/venue/slot",
          "icon": "pi-clone",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        // {
        //   "module": "Scheduled Venue Slot",
        //   "module_description": "Scheduled Venue Slot",
        //   "url": "/manage/venue/scheduled-venue",
        //   "icon": "pi-clone",
        //   "level": 2,
        //   "status": true,
        //   "permission": {
        //     "edit": true,
        //     "view": false
        //   }
        // },
      ]

    };
    moduleToAdd.push(venue);
    const banner = {
      "module": "Banner Management",
      "module_description": "Banner Venue",
      "level": 1,
      "status": true,
      "url": "/manage/banner",
      "icon": "pi-image",
      "permission": {
        "edit": true,
        "view": false
      },

    };
    moduleToAdd.push(banner);
    const wishlist = {
      "module": "Wishlist Management",
      "module_description": "Banner Venue",
      "level": 1,
      "status": true,
      "url": "/manage/wishlist",
      "icon": "pi-heart-fill",
      "permission": {
        "edit": true,
        "view": false
      },

    };
    moduleToAdd.push(wishlist);


    const manageVendor = {
      "module": "Manage Vendor",
      "module_description": "Manage Vendor",
      "level": 1,
      "url": "/manage/vendor",
      "icon": "pi-user-edit",
      "status": true,
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Vendors",
          "module_description": "Vendors",
          "url": "/manage/vendor/list",
          "icon": "pi-user",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
      ]
    };
    moduleToAdd.push(manageVendor);

    const manageCaterers = {
      "module": "Manage Caterers",
      "module_description": "Manage Caterers",
      "level": 1,
      "url": "/manage/caterer",
      "icon": "pi-user-edit",
      "status": true,
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Caterers",
          "module_description": "Caterer",
          "url": "/manage/caterer/list",
          "icon": "pi-user",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
      ]
    };
    moduleToAdd.push(manageCaterers);

    const manageCustomer = {
      "module": "Manage User",
      "module_description": "Manage User",
      "level": 1,
      "url": "/manage/customer",
      "icon": "pi-user-edit",
      "status": true,
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "Register User Account",
          "module_description": "Register User Account",
          "url": "/manage/customer/user",
          "icon": "pi-user",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Newsletter Subscriptions",
          "module_description": "Newsletter Subscriptions",
          "url": "/manage/customer/news-letter",
          "icon": "pi-envelope",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Contact Us Details",
          "module_description": "Contact Us Details",
          "url": "/manage/customer/contact-us",
          "icon": "pi pi-phone",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Product Review Status",
          "module_description": "Product Review Status",
          "url": "/manage/customer/productreview",
          "icon": "pi pi-search",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Order Review Status",
          "module_description": "Newsletter Subscriptions",
          "url": "/manage/customer/orderreview",
          "icon": "pi-file",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
      ]
    };
    moduleToAdd.push(manageCustomer);

    // const calendar = {
    //   "module": "Calendar",
    //   "module_description": "Calendar",
    //   "level": 1,
    //   "status": true,
    //   "url": "/manage/calendar",
    //   "icon": "pi-calendar",
    //   "permission": {
    //     "edit": true,
    //     "view": false
    //   },

    // };
    // moduleToAdd.push(calendar);

    const location = {
      "module": "Location Management",
      "module_description": "Manage Location",
      "level": 1,
      "status": true,
      "url": "/manage/location",
      "icon": "pi pi-globe",
      "permission": {
        "edit": true,
        "view": false
      },
      "submodule": [
        {
          "module": "State Management",
          "module_description": "Manage State",
          "url": "/manage/location/state",
          "icon": "pi-compass",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "City Management",
          "module_description": "Manage City",
          "url": "/manage/location/city",
          "icon": "pi-map-marker",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Subarea Management",
          "module_description": "Manage Subarea",
          "url": "/manage/location/subarea",
          "icon": "pi-map-marker",
          "level": 2,
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          }
        }]
    };
    moduleToAdd.push(location);

    const eventPlanner = {
      "module": "Event Planner Management",
      "module_description": "Manage Event Planner",
      "level": 1,
      "status": true,
      "url": "/manage/eventplanner",
      "icon": "pi-folder-open",
      "permission": {
        "edit": true,
        "view": false
      }
    };
    moduleToAdd.push(eventPlanner);

    return moduleService.addMany(moduleToAdd);
  }
  addRole() {
    const roleToAdd = [];
    const adminrole = {
      "user_role_name": "admin",
      "user_role_description": "admin",
      "status": true,
      "disable": false,
      "default_data": true,
      "created_at": moment.utc().toDate(),
      "permissions": [
        {
          "module": "Role Management",
          "module_description": "Manage Role",
          "level": 1,
          "status": true,
          "url": "/manage/role",
          "icon": "pi-folder-open",
          "permission": {
            "edit": true,
            "view": false
          }
        },
        {
          "module": "Category Management",
          "module_description": "Manage Category",
          "level": 1,
          "status": true,
          "url": "/manage/category",
          "icon": "pi-list",
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Category",
              "module_description": "Category",
              "url": "/manage/category/category",
              "icon": "pi-list",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Sub Category",
              "module_description": "Sub Category",
              "url": "/manage/category/subcategory",
              "icon": "pi-list",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
          ]
        },
        {
          "module": "Content Management",
          "module_description": "Manage Content",
          "level": 1,
          "status": true,
          "url": "/manage/cms",
          "icon": "pi-user-plus",
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Content Page",
              "module_description": "Content Page",
              "url": "/manage/cmsmodule",
              "icon": "pi-clone",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },]
        },
        {
          "module": "Venue Management",
          "module_description": "Manage Venue",
          "level": 1,
          "status": true,
          "url": "/manage/venue",
          "icon": "pi-clone",
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Venue",
              "module_description": "Venue",
              "url": "/manage/venue",
              "icon": "pi-clone",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Venue Slot Management",
              "module_description": "Venue Slot Management",
              "url": "/manage/venue/slot",
              "icon": "pi-clone",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
          ]

        },
        {
          "module": "Admin Management",
          "module_description": "Admin Management",
          "level": 1,
          "status": true,
          "url": "/manage/admin",
          "icon": "pi-user-plus",
          "permission": {
            "edit": true,
            "view": false
          },
        },
        {
          "module": "Manage User",
          "module_description": "Manage User",
          "level": 1,
          "url": "/manage/customer",
          "icon": "pi-user-edit",
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Register User Account",
              "module_description": "Register User Account",
              "url": "/manage/customer/user",
              "icon": "pi-user",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Newsletter Subscriptions",
              "module_description": "Newsletter Subscriptions",
              "url": "/manage/customer/news-letter",
              "icon": "pi-envelope",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Contact Us Details",
              "module_description": "Contact Us Details",
              "url": "/manage/customer/contact-us",
              "icon": "pi pi-phone",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Product Review Status",
              "module_description": "Product Review Status",
              "url": "/manage/customer/productreview",
              "icon": "pi pi-search",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Order Review Status",
              "module_description": "Newsletter Subscriptions",
              "url": "/manage/customer/orderreview",
              "icon": "pi-file",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
          ]
        },
        // {
        //   "module": "Calendar",
        //   "module_description": "Calendar",
        //   "level": 1,
        //   "status": true,
        //   "url": "/manage/calendar",
        //   "icon": "pi-calendar",
        //   "permission": {
        //     "edit": true,
        //     "view": false
        //   },
        // },
        {
          "module": "Banner Management",
          "module_description": "Banner Venue",
          "level": 1,
          "status": true,
          "url": "/manage/banner",
          "icon": "pi-image",
          "permission": {
            "edit": true,
            "view": false
          },
        },
        {
          "module": "Location Management",
          "module_description": "Manage Location",
          "level": 1,
          "status": true,
          "url": "/manage/location",
          "icon": "pi pi-globe",
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "State Management",
              "module_description": "Manage State",
              "url": "/manage/location/state",
              "icon": "pi-compass",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "City Management",
              "module_description": "Manage City",
              "url": "/manage/location/city",
              "icon": "pi-map-marker",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
            {
              "module": "Subarea Management",
              "module_description": "Manage Subarea",
              "url": "/manage/location/subarea",
              "icon": "pi-map-marker",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            }]
        },
        {
          "module": "Manage Vendors",
          "module_description": "Manage Vendors",
          "level": 1,
          "url": "/manage/vendor",
          "icon": "pi-user-edit",
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Vendors",
              "module_description": "Vendor",
              "url": "/manage/vendor/list",
              "icon": "pi-user",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
          ]
        },
        {
          "module": "Manage Caterers",
          "module_description": "Manage Caterers",
          "level": 1,
          "url": "/manage/caterers",
          "icon": "pi-user-edit",
          "status": true,
          "permission": {
            "edit": true,
            "view": false
          },
          "submodule": [
            {
              "module": "Caterers",
              "module_description": "caterers",
              "url": "/manage/caterer/list",
              "icon": "pi-user",
              "level": 2,
              "status": true,
              "permission": {
                "edit": true,
                "view": false
              }
            },
          ]
        },
        {
          "module": "Event Planner Management",
          "module_description": "Manage Event Planner",
          "level": 1,
          "status": true,
          "url": "/manage/eventplanner",
          "icon": "pi-folder-open",
          "permission": {
            "edit": true,
            "view": false
          }
        }
      ]
    };
    roleToAdd.push(adminrole);

    const venueownerrole = {
      "user_role_name": "venueowner",
      "user_role_description": "venueowner",
      "status": true,
      "disable": false,
      "default_data": true,
      "created_at": moment.utc().toDate(),
      "permissions": [
        {
          "module": "Calendar",
          "module_description": "Calendar",
          "level": 1,
          "status": true,
          "url": "/manage/calendar",
          "icon": "pi-calendar",
          "permission": {
            "edit": true,
            "view": false
          },
        },
      ]
    };
    roleToAdd.push(venueownerrole);

    const userrole = {
      "user_role_name": "user",
      "user_role_description": "user",
      "status": true,
      "disable": false,
      "default_data": true,
      "created_at": moment.utc().toDate(),
      "permissions": [
        // {
        //   "module": "Calendar",
        //   "module_description": "Calendar",
        //   "level": 1,
        //   "status": true,
        //   "url": "/manage/calendar",
        //   "icon": "pi-calendar",
        //   "permission": {
        //     "edit": true,
        //     "view": false
        //   },
        // },
      ]
    };
    roleToAdd.push(userrole);

    const vendorrole = {
      "user_role_name": "vendor",
      "user_role_description": "vendor",
      "status": true,
      "disable": false,
      "default_data": true,
      "created_at": moment.utc().toDate(),
      "permissions": [
        {
          "module": "Calendar",
          "module_description": "Calendar",
          "level": 1,
          "status": true,
          "url": "/manage/calendar",
          "icon": "pi-calendar",
          "permission": {
            "edit": true,
            "view": false
          },
        },
      ]
    };
    roleToAdd.push(vendorrole);

    const catererrole = {
      "user_role_name": "caterer",
      "user_role_description": "caterer",
      "status": true,
      "disable": false,
      "default_data": true,
      "created_at": moment.utc().toDate(),
      "permissions": [
        {
          "module": "Calendar",
          "module_description": "Calendar",
          "level": 1,
          "status": true,
          "url": "/manage/calendar",
          "icon": "pi-calendar",
          "permission": {
            "edit": true,
            "view": false
          },
        },
      ]
    };
    roleToAdd.push(catererrole);
    return roleService.addMany(roleToAdd);
  }

  addCustomUsers(roleid) {
    // add 2 custom users
    const usersToAdd = [];
    let hash = cipher.saltHashPassword('!2e4S');
    const admin = {
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@admin.admin',
      fullName: '@Admin',
      role: roleid,
      salt: hash.salt,
      passwordHash: hash.passwordHash,
      status: true,
      disable: false,
      mobileNumber: '1111111111',
      zipcode: "400001",
      gender: 'Female',
      dob: moment().subtract(20, 'year').toDate(),
      countryname: "India",
      countrycode: "IN",
      statename: "Maharashtra",
      statecode: 4008,
      cityname: "Mumbai",
      citycode: "Mumbai",
      timeZone: "Asia/Calcutta",
      timeZoneOffset: "+05:30",
      created_at: moment.utc().toDate()
    };
    usersToAdd.push(admin);

    hash = cipher.saltHashPassword('Wian@1234');
    const user = {
      firstName: 'Wian',
      lastName: 'Amit',
      email: 'wianamit@gmail.com',
      fullName: 'Wian Amit',
      role: roleid,
      salt: hash.salt,
      passwordHash: hash.passwordHash,
      status: true,
      disable: false,
      gender: 'Female',
      dob: moment().subtract(22, 'year').toDate(),
      mobileNumber: '2222222222',
      zipcode: "400001",
      countryname: "India",
      countrycode: "IN",
      statename: "Maharashtra",
      statecode: 4008,
      cityname: "Mumbai",
      citycode: "Mumbai",
      timeZone: "Asia/Calcutta",
      timeZoneOffset: "+05:30",
      created_at: moment.utc().toDate()
    };
    usersToAdd.push(user);

    hash = cipher.saltHashPassword('achal@1234}');
    const user1 = {
      firstName: 'Anchal',
      lastName: 'Easyvenue',
      email: 'anchal@easyvenue.com',
      fullName: 'Anchal Easyvenue',
      role: roleid,
      salt: hash.salt,
      passwordHash: hash.passwordHash,
      status: true,
      disable: false,
      gender: 'Female',
      dob: moment().subtract(22, 'year').toDate(),
      mobileNumber: '1234567890',
      zipcode: "400001",
      countryname: "India",
      countrycode: "IN",
      statename: "Maharashtra",
      statecode: 4008,
      cityname: "Mumbai",
      citycode: "Mumbai",
      timeZone: "Asia/Calcutta",
      timeZoneOffset: "+05:30",
      created_at: moment.utc().toDate()
    };
    usersToAdd.push(user1);

    hash = cipher.saltHashPassword('deep@1234');
    const user2 = {
      firstName: 'Deep',
      lastName: 'Easyvenue',
      email: 'deep@apcgroup.com',
      fullName: 'Deep Easyvenue',
      role: roleid,
      salt: hash.salt,
      passwordHash: hash.passwordHash,
      status: true,
      disable: false,
      gender: 'Male',
      dob: moment().subtract(20, 'year').toDate(),
      mobileNumber: '2345678901',
      zipcode: "400054",
      countryname: "India",
      countrycode: "IN",
      statename: "Maharashtra",
      statecode: 4008,
      cityname: "Mumbai",
      citycode: "Mumbai",
      timeZone: "Asia/Calcutta",
      timeZoneOffset: "+05:30",
      created_at: moment.utc().toDate()
    };
    usersToAdd.push(user2);
    return userService.addMany(usersToAdd);
  }
  addCategory(userId) {
    const categoryToAdd = [];

    const parentCategory = {
      name: 'Parent Category',
      description: 'Parent Category',
      slug: 'parent_category',
      status: true,
      disable: false,
      parent: null,
      default_data: true,
      created_by: userId,
      updated_by: userId,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(parentCategory);


    // const social_events = {
    //   name: 'Social Events',
    //   description: 'Social Events',
    //   slug: 'social_events',
    //   status: true,
    //   disable: false,
    //   parent: null,
    //   default_data: true,
    //   created_by: userId,
    //   updated_by: userId,
    //   created_at: moment.utc().toDate(),
    //   updated_at: moment.utc().toDate()
    // };
    //categoryToAdd.push(social_events);

    const VenueTypes = {
      name: 'Property Type',
      description: 'Property types',
      slug: 'property_type',
      status: true,
      disable: false,
      parent: null,
      default_data: true,
      created_by: userId,
      updated_by: userId,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(VenueTypes);

    const food = {
      name: 'Food',
      description: 'Food',
      slug: 'food',
      status: true,
      disable: false,
      parent: null,
      created_by: userId,
      updated_by: userId,
      default_data: true,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(food);


    const vendor = {
      name: 'Vendor',
      description: 'Vendor',
      slug: 'vendor',
      status: true,
      disable: false,
      parent: null,
      created_by: userId,
      updated_by: userId,
      default_data: true,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(vendor);

    const roomtypes = {
      name: 'Room Type',
      description: 'Room Type',
      slug: 'roomtypes',
      status: true,
      disable: false,
      parent: null,
      created_by: userId,
      updated_by: userId,
      default_data: true,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(roomtypes);

    const foodmenutypes = {
      name: 'Food Menu Type',
      description: 'Room Type',
      slug: 'foodmenutypes',
      status: true,
      disable: false,
      parent: null,
      created_by: userId,
      updated_by: userId,
      default_data: true,
      created_at: moment.utc().toDate(),
      updated_at: moment.utc().toDate()
    };
    categoryToAdd.push(foodmenutypes);
    return categoryService.addMany(categoryToAdd);
  }
  addSlot(userId) {
    const slotToAdd = [];
    const slot1 = {
      "slot": "Morning",
      "description": "From 8 A.M to 3 P.M",
      "status": true,
      "disable": false,
      "created_by": userId,
      "created_at": moment.utc().toDate(),
    };
    slotToAdd.push(slot1);

    const slot2 = {
      "slot": "Evening",
      "description": "From 4 P.M to 10 P.M",
      "status": true,
      "disable": false,
      "created_by": userId,
      "created_at": moment.utc().toDate(),
    };
    slotToAdd.push(slot2);

    const slot3 = {
      "slot": "Full Day",
      "description": "From 8 A.M to 10 P.M",
      "status": true,
      "disable": false,
      "created_by": userId,
      "created_at": moment.utc().toDate(),
    };
    slotToAdd.push(slot3);

    return commonService.addMany(slotToAdd, 'slots');
  }
  addSubarea(userId) {
    commonService.getCityByname("Mumbai").then(data => {
      const subareaToAdd = [];
      const sub1 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Borivali West",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub1);
      const sub2 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Goregaon West",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub2);

      const sub3 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Powai",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub3);

      const sub4 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Lonavala",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub4);

      const sub5 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Thane",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub5);

      const sub6 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Andheri",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub6);

      const sub7 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Malad",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub7);

      const sub8 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Kurla",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub8);

      const sub9 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Dadar",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub9);

      const sub10 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Vasai - Virar",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub10);

      const sub11 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Goregaon",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub11);

      const sub12 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Mira Road",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub12);

      const sub13 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Airoli",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub13);

      const sub14 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Juhu",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub14);

      const sub15 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Chembur",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub15);

      const sub16 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Ghatkopar",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub16);

      const sub17 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Vashi",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub17);

      const sub18 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Panvel",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub18);

      const sub19 = {
        "state_id": data[0]['state_id'],
        "city_id": ObjectId(data[0]['_id']),
        "name": "Dadar",
        "status": true,
        "disable": false,
        "created_by": userId,
        "created_at": moment.utc().toDate(),
      };
      subareaToAdd.push(sub19);
      return commonService.addMany(subareaToAdd, 'subareaes');
    });
  }
  addSubcategory(userId) {
    categoryService.getCategoryBySlug('parent_category').then(category => {
      const subcategoryToAdd = [];
      const subWedding = {
        name: 'Wedding',
        description: 'Wedding',
        slug: 'wedding',
        categoryImage: "wedding.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subWedding);
      const subReception = {
        name: 'Reception',
        description: 'Reception',
        slug: 'reception',
        categoryImage: "reception1.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subReception);

      const subRingCeremony = {
        name: 'Ring Ceremony',
        description: 'Ring Ceremony',
        slug: 'ring_ceremony',
        categoryImage: "engagement.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subRingCeremony);

      const subAnniversary = {
        name: 'Anniversary',
        description: 'Anniversary',
        slug: 'anniversary',
        categoryImage: "anniversary.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subAnniversary);

      const subBirthday = {
        name: 'Birthday Party',
        description: 'Birthday Party',
        slug: 'birthday_party',
        categoryImage: "birthday.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subBirthday);

      const subBabyShower = {
        name: 'Baby Shower',
        description: 'Baby Shower',
        slug: 'baby_shower',
        categoryImage: "babyshower.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subBabyShower);

      const subPool_party = {
        name: 'Pool Party',
        description: 'Pool Party',
        slug: 'pool_party',
        categoryImage: "poolparty.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subPool_party);

      const subCorporateEvents = {
        name: 'Corporate Events',
        description: 'Corporate Events',
        slug: 'corporate_events',
        categoryImage: "corporateevent.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subCorporateEvents);

      const subCorporateMeetings = {
        name: 'Corporate Meetings',
        description: 'Corporate Meetings',
        slug: 'corporate_meetings',
        categoryImage: "corporatemeeting.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subCorporateMeetings);

      const subCoupleDates = {
        name: 'Couple Dates',
        description: 'Couple Dates',
        slug: 'couple_dates',
        categoryImage: "coupledate.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subCoupleDates);

      const subGetTogether = {
        name: 'Get Together',
        description: 'Get Together',
        slug: 'get_together',
        categoryImage: "gettogather.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subGetTogether);
      const subCastles = {
        name: 'Castles',
        description: 'Castles',
        slug: 'castles',
        categoryImage: "castels.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subCastles);
      return categoryService.addMany(subcategoryToAdd);
    });

    categoryService.getCategoryBySlug('property_type').then(category => {
      const subcategoryToAdd = [];
      const subWeddingLawns = {
        name: 'Wedding Lawns',
        description: 'Wedding Lawns',
        slug: 'wedding_lawns',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subWeddingLawns);
      const subVilaOrFarm = {
        name: 'Villa / Farmhouse',
        description: 'Villa / Farmhouse',
        slug: 'villa_or_farmhouse',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVilaOrFarm);

      const subFiveStarHotels = {
        name: '5 Star Hotels',
        description: '5 Star Hotels',
        slug: 'five_star_hotels',
        categoryImage: "hotel-icon.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subFiveStarHotels);
      const subWeddingResorts = {
        name: 'Wedding Resorts',
        description: 'Wedding Resorts',
        slug: 'wedding_resorts',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subWeddingResorts);
      const subCocktailVenues = {
        name: 'Cocktail Venues',
        description: 'Cocktail Venues',
        slug: 'cocktail_venues',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subCocktailVenues);
      const subTerraceBanquetHalls = {
        name: 'Terrace Banquet Halls',
        description: 'Terrace Banquet Halls',
        slug: 'terrace_banquet_halls',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subTerraceBanquetHalls);
      const subHeritageWeddingVenues = {
        name: 'Heritage Wedding Venues',
        description: 'Heritage Wedding Venues',
        slug: 'heritage_wedding_venues',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subHeritageWeddingVenues);
      const subDestinationWedding = {
        name: 'Destination Wedding',
        description: 'Destination Wedding',
        slug: 'destination_wedding',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subDestinationWedding);
      const subMantapaOrConventionHall = {
        name: 'Mantapa / Convention Hall',
        description: 'Mantapa / Convention Hall',
        slug: 'mantapa_or_convention_hall',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subMantapaOrConventionHall);
      const subBirthdayPartyHalls = {
        name: 'Birthday Party Halls',
        description: 'Birthday Party Halls',
        slug: 'birthday_party_halls',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subBirthdayPartyHalls);

      const subConferenceVenues = {
        name: 'Conference Venues',
        description: 'Conference Venues',
        slug: 'conference_venues',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subConferenceVenues);
      const subPartyPlots = {
        name: 'Party Plots',
        description: 'Party Plots',
        slug: 'party_plots',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subPartyPlots);
      const subMarriageHalls = {
        name: 'Marriage Halls',
        description: 'Marriage Halls',
        slug: 'marriage_halls',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subMarriageHalls);
      const subWeddingHotels = {
        name: 'Wedding Hotels',
        description: 'Wedding Hotels',
        slug: 'wedding_hotels',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subWeddingHotels);
      const subBeachWeddingVenues = {
        name: 'Beach Wedding Venues',
        description: 'Beach Wedding Venues',
        slug: 'beach_wedding_venues',
        categoryImage: "banquet.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subBeachWeddingVenues);

      return categoryService.addMany(subcategoryToAdd);
    });


    categoryService.getCategoryBySlug('roomtypes').then(category => {
      const subcategoryToAdd = [];
      const subSingle = {
        name: 'Single',
        description: 'Single',
        slug: 'single',
        categoryImage: "bed.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subSingle);

      const subDouble = {
        name: 'Double',
        description: 'double',
        slug: 'double',
        categoryImage: "bed.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subDouble);

      const subTriple = {
        name: 'Triple',
        description: 'Triple',
        slug: 'triple',
        categoryImage: "bed.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subTriple);

      const subQuad = {
        name: 'Quad',
        description: 'Quad',
        slug: 'quad',
        categoryImage: "bed.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subQuad);
      return categoryService.addMany(subcategoryToAdd);
    });

    categoryService.getCategoryBySlug('vendor').then(category => {
      const subcategoryToAdd = [];
      const subVendorPhotographer = {
        name: 'Photographer',
        description: 'Photographer',
        slug: 'photographer',
        categoryImage: "photographer.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVendorPhotographer);
      const subVendorVideographer = {
        name: 'Videographer',
        description: 'Videographer',
        slug: 'photographer',
        categoryImage: "videographer.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVendorVideographer);

      const subVendorMehendi = {
        name: 'Mehendi Artist',
        description: 'Mehendi Artist',
        slug: 'photographer',
        categoryImage: "mehendi_artist.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVendorMehendi);

      const subVendorDecorater = {
        name: 'Decorater',
        description: 'Decorater',
        slug: 'decorater',
        categoryImage: "decorater.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVendorDecorater);

      const subVendorCaterer = {
        name: 'Caterer',
        description: 'Caterer',
        slug: 'caterer',
        categoryImage: "caterer.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVendorCaterer);
      return categoryService.addMany(subcategoryToAdd);
    });

    categoryService.getCategoryBySlug('food').then(category => {
      const subcategoryToAdd = [];
      const subVegfood = {
        name: 'Veg',
        description: 'Veg Food',
        slug: 'veg_food',
        categoryImage: "veg.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subVegfood);

      const subNonVegfood = {
        name: 'Non Veg',
        description: 'Non Veg',
        slug: 'non_veg',
        categoryImage: "non-veg.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subNonVegfood);

      const subMixfood = {
        name: 'Mix Food',
        description: 'Veg & Non Veg food',
        slug: 'mixFood',
        categoryImage: "mixed.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subMixfood);

      const subJainfood = {
        name: 'Jain Food',
        description: 'Jain food',
        slug: 'jainFood',
        categoryImage: "jain.png",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(subJainfood);
      return categoryService.addMany(subcategoryToAdd);
    })

    categoryService.getCategoryBySlug('foodmenutypes').then(category => {
      const subcategoryToAdd = [];
      const sub1X1 = {
        name: '1 X 1',
        description: '1 X 1',
        slug: '1X1',
        categoryImage: "plate.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(sub1X1);

      const sub2X2 = {
        name: '2 X 2',
        description: '2 X 2',
        slug: '2X2',
        categoryImage: "plate.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(sub2X2);

      const sub3X3 = {
        name: '3 X 3',
        description: '3 X 3',
        slug: '3X3',
        categoryImage: "plate.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(sub3X3);

      const sub4X4 = {
        name: '4 X 4',
        description: '4 X 4',
        slug: '4X4',
        categoryImage: "plate.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(sub4X4);

      const sub5X5 = {
        name: '5 X 5',
        description: '5 X 5',
        slug: '5X5',
        categoryImage: "plate.svg",
        status: true,
        disable: false,
        parent: category[0]._id,
        default_data: true,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate(),
        updated_at: moment.utc().toDate()
      };
      subcategoryToAdd.push(sub5X5);

      return categoryService.addMany(subcategoryToAdd);
    });
  }
}

module.exports = SeedService;
