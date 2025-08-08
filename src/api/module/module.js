const router = require("express").Router();
const Module = require("../../../model/Module");
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const cipher = require('../common/auth/cipherHelper');
const ModuleService = require('./moduleService');
const moduleService = new ModuleService();
var moment = require('moment');

// Add Module
router.post("/", auth, async (req, res)=> {
    const userId = cipher.getUserFromToken(req);
    const moduleObj = new Module({
        module: req.body.module,
        module_description: req.body.module_description,
        level: req.body.level,
        status: req.body.status,
        permission: {
            edit:req.body.permission.edit,
            view:req.body.permission.view,
        },
        submodule: req.body.submodule,
        created_by: userId,
        updated_by: userId,
        created_at: moment.utc().toDate()
    })
    try{
        moduleService
        .addModule(moduleObj)
        .then(module => {
            //console.log(module.insertedId);
            res.json({message: "Data Inserted Successfully", id: module.insertedId});                
        })
        .catch(err => res.status(400).send({ error: err.message })); 
    } catch (error) {
        res.status(404).send(error);
    }
});

//get list of modules by multiple ids
router.post("/getByids", auth, async (req, res)=> {
    const userId = cipher.getUserFromToken(req);
    const ids = req.body.ids;
    //console.log(ids);
    try{
        const results = await Module.find({ _id: ids})
        res.json({totalCount:results.length, data: results});

    } catch (error) {
        res.status(404).send(error);
    }
});

// Get All Module Listing
router.get("/", auth, async (req, res)=> { 
    try {
        moduleService
        .list(req.query)
        .then(module => {
            res.json({totalCount:module.length, data: module});                
        })
    } catch (error) {
        res.json({ message: error});
    }
 });

// Get Single Module Listing
router.get("/:moduleId", auth, async (req, res)=> { 
    try {
        const module = await moduleService.findById(req.params.moduleId);  
        res.json(module);
    } catch (error) {
        res.json({ message: error});
    }
});
 
// Get levelwise Module Listing
router.get("/level/:level", auth, async (req, res)=> { 
    try {
        const modules = await Module.find({"level": req.params.level}).select({_id:1, module:1, level:1, status:1, permission:1});  
        res.json({totalCount:modules.length, data: modules});
    } catch (error) {
        res.json({ message: error});
    }
});

// Update Module
router.put("/:moduleId", auth, async (req, res)=> {
    try {
        const userId = cipher.getUserFromToken(req);
        const moduleObj = {
            module: req.body.module,
            module_description: req.body.module_description,
            level: req.body.level,
            status: req.body.status,
            permission: {
                edit:req.body.permission.edit,
                view:req.body.permission.view,
            },
            submodule: req.body.submodule,
            updated_by: userId,
            updated_at: moment.utc().toDate()
        };        
        moduleService
        .edit(req.params.moduleId, moduleObj)
        .then(module => {
            res.json({message: "Data Updated Successfully", data:module.value})
        })
        .catch(error => {
            res.status(404); 
            res.json({message: "Error while Saving data"})
        });
    } catch (error) {
        res.json({ message: error});
    }
});

//Delete Module
router.delete("/:moduleId", auth, async (req, res)=> {
    try{
        const removeModule = await Module.findByIdAndDelete(req.params.moduleId);
        res.json({message: "Data Deleted Successfully"});   
    } catch (error) {
        res.json({ message: error});
    }
});
module.exports = router;