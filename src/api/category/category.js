const router = require("express").Router();
const Category = require("../../../model/Category");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const CategoryService = require('./categoryService');
const categoryService = new CategoryService();
const { ObjectId } = require('mongodb');
var moment = require('moment');
const uuidv1 = require('uuid');
const { picture } = require('config');
router.post('/', auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        var parentId;
        if (typeof req.body.parentcategorycode !== 'undefined' && req.body.parentcategorycode !== null) {
            parentId = ObjectId(req.body.parentcategorycode);
        } else {
            parentId = null;
        }

        let categoryImagefilename;
        if (typeof req.body.categoryImage != 'undefined' && req.body.categoryImage != "") {
            const categoryImageData = req.body.categoryImage;
            const fileType = categoryImageData.match(/[^:/]\w+(?=;|,)/)[0];
            categoryImagefilename = uuidv1() + "." + fileType;
            categoryImagepath = picture.categoryPicFolder + categoryImagefilename;
            let categoryFilename;
            categoryFilename = __dirname + "/../../../" + categoryImagepath;            
            var base64Data;
            if (req.body.categoryImage.indexOf("data:image/png;") !== -1) {
                base64Data = req.body.categoryImage.replace(/^data:image\/png;base64,/, "");
            } else if (req.body.categoryImage.indexOf("data:image/jpg;") !== -1) {
                base64Data = req.body.categoryImage.replace(/^data:image\/jpg;base64,/, "");
            } else if (req.body.categoryImage.indexOf("data:image/jpeg") !== -1) {
                base64Data = req.body.categoryImage.replace(/^data:image\/jpeg;base64,/, "");
            }
            else if (req.body.categoryImage.indexOf("data:image/svg") !== -1) {
                base64Data = req.body.categoryImage.replace(/^data:image\/svg;base64,/, "");
            }
            if (typeof base64Data == 'undefined') {
                res.json({ message: "Only png, jpg, jpeg svg  files are allowed!!" });
            } else if (base64Data != "") {
                require("fs").writeFile(categoryFilename, base64Data, 'base64', function (err) {
                    console.log(err);
                });
            }
        }
        const categoryObj = new Category({
            name: req.body.name,
            description: req.body.description,
            categoryImage: categoryImagefilename,
            status: req.body.status,
            disable: req.body.disable,
            parent: parentId,
            created_by: userId,
            updated_by: ObjectId(userId),
            default_data: req.body.default_data,
        })        
        categoryService
            .addCategory(categoryObj)
            .then(category => {
                res.json({ message: "Data Inserted Successfully", id: category.insertedId });
            })
            .catch(err => res.status(400).send({ error: err.message }));
    } catch (error) {
        res.json({ message: error });
    }
});
//use this api for website
router.get("/v1/", async (req, res) => {
    try {
        //console.log("Without Auth");
        categoryService
            .list(req.query,false)
            .then(category => {
                res.json({ totalCount: category.length, data: category });
            })
    } catch (error) {
        res.json({ message: error });
    }
});
// Get All Content Listing for logged in user
router.get("/", auth, async (req, res) => {
    try {
        //console.log("With Auth");
        categoryService
            .list(req.query, true)
            .then(category => {
                res.json({ totalCount: category.length, data: category });
            })
    } catch (error) {
        res.json({ message: error });
    }
});

router.get("/all", async (req, res) => {
    try {
        const data = await categoryService.getAllParentCategory(req.query);
        res.json({ data });
    } catch (error) {
        res.json({ message: error });
    }
});

router.get("/categoryByName",async (req,res) =>{
    try{
        const originalData = await Category.findOne({name:req.query.name});
        const newData = {
            id: originalData._id,
            name: originalData.name,
            description: originalData.description,
            slug: originalData.slug,
            categoryImage: originalData.categoryImage,
            status: originalData.status,
            disable: originalData.disable,
            parent: originalData.parent,
            default_data: originalData.default_data,
            created_by: originalData.created_by,
            updated_by: originalData.updated_by,
            created_at: originalData.created_at,
            updated_at: originalData.updated_at
        };
        res.status(200).json({data:newData})
    }catch(err){
        res.status(500).json({message:err.message})
    }
})

router.get("/descendants", async (req, res) => {
    try {
        const data = await categoryService.getParentwiseChildCategory();
        res.json({ data });
    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Content Listing
router.get("/:categoryId", auth, async (req, res) => {
    try {
        const category = await categoryService.findById(req.params.categoryId);
        res.json(category);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Content
router.put("/:categoryId", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        const categoryObj = [];
        categoryObj['updated_by'] = ObjectId(userId);
        categoryObj['updated_at'] = moment.utc().toDate();
        let categoryImagefilename;
        for (var key in req.body) {
            if (key == "disable" && req.body.disable == true) {
                categoryObj['disable'] = req.body[key];
                categoryObj['deleted_by'] = ObjectId(userId);
                categoryObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                categoryObj['status'] = req.body[key];
            } else if (key == "parent") {
                categoryObj['parent'] = ObjectId(req.body[key]);
            } else if (key == "categoryImage") {
                const categoryImageData = req.body.categoryImage;
                const fileType = categoryImageData.match(/[^:/]\w+(?=;|,)/)[0];
                categoryImagefilename = uuidv1() + "." + fileType;
                categoryImagepath = picture.categoryPicFolder + categoryImagefilename;
                let categoryFilename;
                categoryFilename = __dirname + "/../../../" + categoryImagepath;                
                var base64Data;
                if (req.body.categoryImage.indexOf("data:image/png;") !== -1) {
                    base64Data = req.body.categoryImage.replace(/^data:image\/png;base64,/, "");
                } else if (req.body.categoryImage.indexOf("data:image/jpg;") !== -1) {
                    base64Data = req.body.categoryImage.replace(/^data:image\/jpg;base64,/, "");
                } else if (req.body.categoryImage.indexOf("data:image/jpeg") !== -1) {
                    base64Data = req.body.categoryImage.replace(/^data:image\/jpeg;base64,/, "");
                }
                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {
                    require("fs").writeFile(categoryFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    categoryObj[key] = categoryImagefilename;
                }
            } else if (req.body[key] != "" && (key != "parent" || key != "status" || key != "categoryImage")) {
                categoryObj[key] = req.body[key];
            }
        }        
        const updateData = Object.assign({}, categoryObj);
        const updatedCategory = await categoryService.updateCategory(req.params.categoryId, updateData);
        res.json({ message: "Data Updated Successfully", data: updatedCategory });
    } catch (error) {
        res.json({ message: error });
    }
});

//Delet Content
router.delete("/:categoryId", auth, async (req, res) => {
    try {
        const removeCategory = await categoryService.findByIdAndDelete(req.params.categoryId);
        res.json({ message: "Data Deleted Successfully" });
    } catch (error) {
        res.json({ message: error });
    }
});
module.exports = router;