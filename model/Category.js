const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let User = require('../model/User');
// const categorySchema = new Schema({
//     _id: Schema.Types.ObjectId,
// 	name:String,
//     level: Number,
//     parent_category: String,
//     parentcategorycode: {type: Schema.Types.ObjectId, ref: "category"},
// 	description: String,
//     status: String,
//     created_by: {type: Schema.Types.ObjectId, ref: "User"},
//     created_at: { type: Date, default: Date.now },
//     updated_by: {type: Schema.Types.ObjectId, ref: "User"},
//     updated_at: { type: Date, default: Date.now },  
// });
// module.exports = mongoose.model('category', categorySchema);

const categorySchema = new Schema({
    name: String,
    slug: { type: String, index: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Category'
    },
    categoryImage: String,
    // ancestors: [{
    //      _id: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Category",
    //         index: true
    //      },
    //      name: String,
    //      slug: String
    // }],
    description: String,
    status: Boolean,
    disable: Boolean,
    default_data:Boolean,
    created_by: {type: Schema.Types.ObjectId, ref: "User"},
    created_at: { type: Date, default: Date.now },
    updated_by: {type: Schema.Types.ObjectId, ref: "User"},
    updated_at: { type: Date, default: Date.now },  
    deleted_by: {type: Schema.Types.ObjectId, ref: "User"},
    deleted_at: { type: Date }
});


// categorySchema.pre('save', async function (next) {
//     this.slug = slugify(this.name);
//     next();
//  });

// function slugify(string) {
//     const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
//     const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
//     const p = new RegExp(a.split('').join('|'), 'g')
  
//     return string.toString().toLowerCase()
//       .replace(/\s+/g, '-') // Replace spaces with -
//       .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
//       .replace(/&/g, '-and-') // Replace & with 'and'
//       .replace(/[^\w\-]+/g, '') // Remove all non-word characters
//       .replace(/\-\-+/g, '-') // Replace multiple - with single -
//       .replace(/^-+/, '') // Trim - from start of text
//       .replace(/-+$/, '') // Trim - from end of text
// }
module.exports = mongoose.model('categories', categorySchema);