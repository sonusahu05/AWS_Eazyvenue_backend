var mongodb = require('mongodb');
var mongo = require('mongodb').MongoClient;
var express = require('express'); 
var mongoose = require('mongoose');
var multer = require('multer');
var router = express.Router();
var nodemailer = require('nodemailer');

// Multer File upload settings
const cmspicDIR = '../../public/uploads/cmsPic';

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: "wiankim@gmail.com",
    pass: "4M@%%]mk",
   
  },
});

function middleware(req, res, next) {
  var imageName;
  var mimetype;
  var uploadStorage = multer.diskStorage({
      destination: function (req, file, cb) 
      {
          cb(null, cmspicDIR);
      },
      filename: function (req, file, cb) 
      {
        //console.log(file);
          imageName = `${Date.now()}-${file.originalname}`;
          mimetype = file.mimetype;
          //console.log(mimetype);
     // cb(null, imageName + path.extname(file.originalname))
      cb(null, imageName)
      }
  });
  var uploader = multer({storage: uploadStorage});
  var uploadFile = uploader.single('image');
  uploadFile(req, res, function (err) {
      req.imageName = imageName;
      req.mimetype = mimetype;
      req.uploadError = err;
      next();
  })
}

router.post('/upload', middleware, (req, res, next) => {	
  req.body.image = req.imageName;
  //console.log(req);
  res.status(200).json({
    file: req.imageName,
    mimetype: req.mimetype
  })
});

router.post('/sendEmail', (req, res) => {
// console.log(req.body);
      var myobj = req.body;     
  //  var fileContent =req.body.file;    
  //  var base64Content = fileContent.replace("data:application/pdf;filename=generated.pdf;base64,", "");
   //     console.log(base64Content);
    //var fromAddress ="wiankim@gmail.com";
    var fromAddress ='"Admin Facinating Diamond" <admin@diamond.com>';
    var toAddress ='"'+req.body.name+'"'+req.body.email;
    transporter.sendMail({
    
    from: fromAddress, // sender address    
    to: toAddress,
    //to: req.body.email,
    cc: "deepak.shaw@wiantech.com",
    subject: req.body.subject, // Subject line
    text: req.body.textcontent,    
    }).then(info => {
    //console.log({info});
      res.send(info);
    }).catch(console.error);

     // res.send(myobj);   
});

module.exports = router;