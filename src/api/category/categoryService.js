const jwt = require('jsonwebtoken');
const config = require('config');
const Category = require("../../../model/Category");
const CategoryRepository = require('./categoryRepository');
const cipher = require('../common/auth/cipherHelper');
const { api, frontEnd, picture } = require('config');
const fs = require("fs");
var moment = require('moment');
class CategoryService {
    constructor() {
        this.repository = new CategoryRepository();
    }

    addMany(categories) {
        return this.repository.addMany(categories);
    }

    addCategory(category) {
        return this.repository.findByCategoryName(category.name).then((existingCategory) => {
            if (existingCategory) {
                throw new Error('Category already exists');
            }
            return this.repository.add(category);
        })
    }

    buildAncestors = async (id, parent_id) => {
        let ancest = [];
        try {
            let parent_category = await Category.findOne({ "_id": parent_id }, { "name": 1, "slug": 1, "ancestors": 1 }).exec();
            if (parent_category) {
                const { _id, name, slug } = parent_category;
                const ancest = [...parent_category.ancestors];
                ancest.unshift({ _id, name, slug })
                const category = await Category.findByIdAndUpdate(id, { $set: { "ancestors": ancest } });
            }
        } catch (err) {
            console.log(err.message)
        }
    }

    findById(id) {
        return this.repository.findById(id)
            .then(category => this.mapCategoryToDto(category[0]), true);
    }

    getCategoryBySlug(slug) {
        return this.repository.getCategoryBySlug(slug);
    }

    updateCategory(id, categoryData) {
        return this.repository.edit(id, categoryData).then((category) => {
            return this.findById(id);
        });
    }

    buildHierarchyAncestors = async (category_id, parent_id) => {
        if (category_id && parent_id) {

            this.buildAncestors(category_id, parent_id)
            const result = await Category.find({ 'parent': category_id }).exec();
            if (result) {
                result.forEach((doc) => {
                    this.buildHierarchyAncestors(doc._id, category_id)
                })
            }
        }
    }

    getAllParentCategory(filter) {
        return this.repository.getAllCategory(filter).then(data => {
            return {
                totalCount: data.length,
                items: data.map(item => this.mapCategoryData(item)),
            };
        });
    }

    getParentwiseChildCategory() {
        return this.repository.getParentwiseChildCategory();
    }

    getCategoriesByParentId(id){
        return this.repository.getCategoriesByParentId(id);
    }

    list(filter, showAll) {
        return Promise.all([
            this.repository.listFiltered(filter),
            this.repository.getCountFiltered(filter),
        ])
            .then(([data, totalRecords]) => {
                return {
                    totalCount: totalRecords.length,
                    items: data.map(item => this.mapCategoryToDto(item, showAll))
                };
            });
    }
    getPhotoURL(name) {
        if (typeof name !== 'undefined' && name !== null) {
            var imgpath = picture.categoryPicFolder + name;
            if (fs.existsSync(imgpath)) {
                return frontEnd.picPath  + "/" + picture.showCategoryPicFolderPath + name;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    mapCategoryToDto(category, showAll) {

        var createdBy;
        if (category.createduserdata.length > 0) {
            createdBy = category.createduserdata[0].firstName + ' ' + category.createduserdata[0].lastName;
        }
        var updatedBy;
        if (category.updateduserdata.length > 0) {
            updatedBy = category.updateduserdata[0].firstName + ' ' + category.updateduserdata[0].lastName;
        }

        var parent_category = "";
        var parentcategorycode = "";
        if (category.parentcategorydata.length > 0) {
            parent_category = category.parentcategorydata[0].name;
            parentcategorycode = category.parentcategorydata[0]._id;
        }
        if (showAll) {
            return category ? {
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                status: category.status,
                parentcategorycode: parentcategorycode,
                parent_category: parent_category,
                default_data: category.default_data,
                categoryImage: this.getPhotoURL(category.categoryImage),
                disable: category.disable,
                created_at: moment(category.created_at).format("MM/DD/YYYY"),
                updated_at: moment(category.updated_at).format("MM/DD/YYYY"),
                createdby: category.created_by,
                createdBy: createdBy,
                updatedby: category.updated_by,
                updatedBy: updatedBy,
                show: false
            } : {};
        } else {
            return category ? {
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                status: category.status,
                parentcategorycode: parentcategorycode,
                parent_category: parent_category,
                default_data: category.default_data,
                categoryImage: this.getPhotoURL(category.categoryImage),
                disable: category.disable,
                show: false
            } : {};
        }
    }

    getAllParentCategory(filter) {
        return this.repository.getAllCategory(filter).then(data => {
            return {
                totalCount: data.length,
                items: data.map(item => this.mapCategoryData(item)),
            };
        });
    }

    getAllChilds(parentid) {
        return this.repository.getAllSubCategory(parentid).then(data => {
            return {
                totalCount: data.length,
                items: data.map(item => this.mapCategoryData(item)),
            };
        });
    }

    mapCategoryData(category) {
        return category ? {
            name: category.name,
            code: category._id
        } : {};
    }
}

module.exports = CategoryService;