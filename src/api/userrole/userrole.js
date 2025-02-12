const router = require("express").Router();
const UserRole = require("../../../model/UserRole");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const UserroleService = require('./userroleService');
const userroleService = new UserroleService();
const { ObjectID } = require('mongodb');
var moment = require('moment');
router.post('/', auth, async(req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const userroleObj = new UserRole({
            user_role_name: req.body.user_role_name,
            user_role_description: req.body.user_role_description,
            status: req.body.status,
            disable:req.body.disable,
            default_data:req.body.default_data,
            permissions: req.body.permissions,
            created_by: userId,
            updated_by: ObjectID(userId)
        })
        //console.log(userroleObj);
        //return false;
        userroleService
        .addRole(userroleObj)
        .then(userrole => {
            //console.log(userrole.insertedId);
            res.json({message: "Data Inserted Successfully", id: userrole.insertedId});                
        })
        .catch(err => res.status(400).send({ error: err.message }));
    } catch(error) {
        res.json({ message: error});
    }
});

// Get All Content Listing
router.get("/", auth, async (req, res)=> { 
    try {
        userroleService
        .list(req.query)
        .then(userrole => {
            res.json({totalCount:userrole.length, data: userrole});                
        })
    } catch (error) {
        res.json({ message: error});
    }
 });

// Get Single Content Listing
router.get("/:userroleId", auth, async (req, res)=> { 
    try {
        const userrole = await userroleService.findById(req.params.userroleId);  
        res.json(userrole);
    } catch (error) {
        res.json({ message: error});
    }
});

// Update Content
router.put("/:userroleId", auth, async (req, res)=> {
    try {
        const userId = cipher.getUserFromToken(req);
        const userObj = [];
        userObj['updated_by'] =  ObjectID(userId);
        userObj['updated_at'] = moment.utc().toDate();
        for(var key in req.body) {
            if(key == "disable" && req.body.disable == true) {
                userObj['disable'] = req.body[key];       
                userObj['deleted_by'] = ObjectID(userId);
                userObj['deleted_at'] = moment.utc().toDate();
            } else if(key == "status") {
                userObj['status'] = req.body[key];       
            } else if(req.body[key] != "") {
                userObj[key] = req.body[key];       
            }
        }
        
        const updateData = Object.assign({}, userObj);        
        const updatedUserRole = await userroleService.updateUserRole(req.params.userroleId, updateData); 
        res.json({message: "Data Updated Successfully", data: updatedUserRole});    
    } catch (error) {
        res.json({ message: error});
    }
});

//Delet Content
router.delete("/:userroleId", auth, async (req, res)=> {
    try {        
        const removeUserRole = await UserRole.findByIdAndDelete(req.params.userroleId);
        res.json({message: "Data Deleted Successfully"}); 
    } catch (error) {
        res.json({ message: error});
    }
});
module.exports = router;