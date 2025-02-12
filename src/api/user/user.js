const router = require("express").Router();
//const UserManagement = require("../../../model/UserManagement");
const User = require("../../../model/User");
const cipher = require('../common/auth/cipherHelper');
const passport = require('passport');
const auth = passport.authenticate('jwt', { session: false });
const UserService = require('./userService');
const UserRoleService = require('../userrole/userroleService');
const { picture, frontEnd, api } = require('config');
const uuidv1 = require('uuid');
const userService = new UserService();
const userroleService = new UserRoleService();
const { ObjectId } = require('mongodb');
const { check, validationResult } = require('express-validator');
var moment = require('moment');
const AuthService = require('../common/auth/authService');
const authService = new AuthService();
const config = require('config');
const crypto = require('crypto');
const RoleService = require("../common/role/roleService");

const {
    secret, ttl, algorithm, inputEncoding, outputEncoding,
} = config.get('auth.resetPassword');
function uploadPortfolioImage(portfolioImages) {
    var portfolioImagefilename = [];
    portfolioImages.forEach(element => {
        const portfolioImageData = element.file;
        const fileType = portfolioImageData.match(/[^:/]\w+(?=;|,)/)[0];
        portfolioFile = uuidv1() + "." + fileType;
        portfolioImagefilename.push({ venue_image_src: portfolioFile, alt: element.alt, default: element.default });
        portfolioPath = picture.portfolioPicFolder + portfolioFile;
        let portfoliofilename;
        portfoliofilename = __dirname + "/../../../" + portfolioPath;
        var base64Data;
        if (portfolioImageData.indexOf("data:image/png;") !== -1) {
            base64Data = portfolioImageData.replace(/^data:image\/png;base64,/, "");
        } else if (portfolioImageData.indexOf("data:image/jpg;") !== -1) {
            base64Data = portfolioImageData.replace(/^data:image\/jpg;base64,/, "");
        } else if (portfolioImageData.indexOf("data:image/jpeg") !== -1) {
            base64Data = portfolioImageData.replace(/^data:image\/jpeg;base64,/, "");
        }

        if (typeof base64Data == 'undefined') {
            res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
        } else if (base64Data != "") {

            require("fs").writeFile(portfoliofilename, base64Data, 'base64', function (err) {
                console.log(err);
            });
        }
    });
    return portfolioImagefilename;
}

// Add Content
router.post("/", [
    check('firstName').not().isEmpty().withMessage('First Name is required'),
    check('lastName').not().isEmpty().withMessage('Last Name is required'),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').isLength({ min: 6 }).custom((val, { req, loc, path }) => {
        if (val !== req.body.confirmPassword) {
            throw new Error("Passwords don't match");
        } else {
            return true;
        }
    }),
    check('mobileNumber').not().isEmpty().withMessage('Mobile Number is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).jsonp(errors.array());
        } else {
            const userId = cipher.getUserFromToken(req);
            const { salt, passwordHash } = cipher.saltHashPassword(req.body.password);
            let profilepicfilename;
            if (typeof req.body.profilepic != 'undefined' && req.body.profilepic != "") {
                const profilepicData = req.body.profilepic;
                const fileType = profilepicData.match(/[^:/]\w+(?=;|,)/)[0];
                profilepicfilename = uuidv1() + "." + fileType;
                profilepicpath = picture.profilePicFolder + profilepicfilename;
                let profileFilename;
                profileFilename = __dirname + "/../../../" + profilepicpath;

                var base64Data;
                if (req.body.profilepic.indexOf("data:image/png;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/png;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpg;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpg;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpeg") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpeg;base64,/, "");
                }

                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {
                    require("fs").writeFile(profileFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                }
            }
            var portfoliofilename;
            if (typeof req.body.portfolioImage != 'undefined' && req.body.portfolioImage != "") {
                portfoliofilename = uploadPortfolioImage(req.body.portfolioImage);
            }

            var zipcode = req.body.zipcode;
            var mobileNumber = req.body.mobileNumber;

            var categoryId;
            if (typeof req.body.category !== 'undefined' && req.body.category !== null) {
                categoryId = ObjectId(req.body.category);
            } else {
                categoryId = null;
            }

            var userObj;
            userObj = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                fullName: req.body.firstName + " " + req.body.lastName,
                role: req.body.role,
                //organizationId: ObjectId(req.body.organizationId),
                age: req.body.age,
                status: req.body.status,
                disable: req.body.disable,
                address: req.body.address.replace(/[\r\n]/gm, ' '),
                salt: salt,
                passwordHash: passwordHash,
                gender: req.body.gender,
                category: categoryId,
                dob: moment(req.body.dob, "YYYY-MM-DD").utc().toDate(),
                mobileNumber: mobileNumber.toString(),
                zipcode: zipcode.toString(),
                profilepic: profilepicfilename,
                portfolioImage: portfoliofilename,
                countrycode: req.body.countrycode,
                countryname: req.body.countryname,
                statecode: req.body.statecode,
                statename: req.body.statename,
                citycode: req.body.citycode,
                cityname: req.body.cityname,
                timeZone: req.body.timeZone,
                timeZoneOffset: req.body.timeZoneOffset,
                created_by: userId,
                updated_by: ObjectId(userId),
            });
            userService
                .addUser(userObj)
                .then(user => {
                    res.json({ message: "Data Inserted Successfully", id: user.insertedId });
                })
        }
    } catch (error) {

        res.status(400).json({ message: error, status: 400 });
    }
});


// Get All Content Listing
router.get("/", auth, async (req, res) => {
    try {
        userService
            .list(req.query)
            .then(user => {
                res.json({ totalCount: user.length, data: user });
            })

    } catch (error) {
        res.json({ message: error });
    }
});

// Get Single Content Listing
router.get("/:userid", auth, async (req, res) => {
    try {
        const userData = await userService.findById(req.params.userid);
        res.json(userData);
    } catch (error) {
        res.json({ message: error });
    }
});

// Update Content
router.put("/:userid", auth, async (req, res) => {
    try {
        const userId = cipher.getUserFromToken(req);
        let profilepicfilename;
        const userObj = [];
        userObj['updated_by'] = ObjectId(userId);
        userObj['updated_at'] = moment.utc().toDate();
        let oldPortfolioImagesArray = [];
        let portfolioImageDetails = [];
        let deletedPortfolioImages = [];

        const userData = await userService.finddetailById(req.params.userid);
        if (userData != undefined) {
            if (userData.portfolioImage) {
                portfolioImageDetails = userData.portfolioImage;
            }

            if (portfolioImageDetails.length > 0) {
                oldPortfolioImagesArray = await getOldImagesArray(portfolioImageDetails);
            }
        }
        let newPortfolioImagesArr = [];

        if (req.body.password != "" && req.body.confirmnewpassword != "" && req.body.password != req.body.confirmPassword) {
            res.status(400).json({ message: "New Password and confirm new password must be same", status: 400 });
        }

        for (var key in req.body) {
            if (key == "currentPassword" && req.body.currentPassword != "" && req.body.password != "" && req.body.confirmPassword != "" && req.body.password == req.body.confirmPassword) {
                //const userData = await userService.finddetailById(req.params.userid);                
                const { passwordHash } = cipher.sha512(req.body.currentPassword, userData.salt);
                if (userData.passwordHash !== passwordHash) {
                    res.status(400).json({ message: "Invalid Current Password", status: 400 });
                    return;
                } else {
                    const { salt, passwordHash } = cipher.saltHashPassword(req.body.password);
                    userObj['salt'] = salt;
                    userObj['passwordHash'] = passwordHash;
                }
            }
            if (key == "firstName" || key == "lastName") {
                userObj["firstName"] = req.body.firstName;
                userObj["lastName"] = req.body.lastName;
                userObj["fullName"] = req.body.firstName + " " + req.body.lastName;
            } else if (key == "disable" && req.body.disable == true) {
                userObj['disable'] = req.body[key];
                userObj['deleted_by'] = ObjectId(userId);
                userObj['deleted_at'] = moment.utc().toDate();
            } else if (key == "status") {
                userObj['status'] = req.body[key];
            } else if (key == "mobile") {
                userObj['mobile'] = req.body[key];
            } else if (key == "zipcode" && req.body[key] != "") {
                userObj['zipcode'] = req.body[key];
            } else if (key == "createForFriend") {
                userObj['createForFriend'] = req.body[key];
            } else if (key == "dob") {
                var dob = moment(req.body.dob, "YYYY-MM-DD").utc().toDate();
                userObj['dob'] = dob;
            } else if (key == "address") {
                userObj[key] = req.body[key].replace(/[\r\n]/gm, ' ');
            } else if (key == "category") {
                userObj['category'] = ObjectId(req.body[key]);
            } else if (key == 'profilepic' && req.body.profilepic != "") {
                const profilepicData = req.body.profilepic;
                const fileType = profilepicData.match(/[^:/]\w+(?=;|,)/)[0];
                profilepicfilename = uuidv1() + "." + fileType;
                profilepicpath = picture.profilePicFolder + profilepicfilename;
                let profileFilename = "";
                profileFilename = __dirname + "/../../../" + profilepicpath;

                var base64Data;
                if (req.body.profilepic.indexOf("data:image/png;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/png;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpg;") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpg;base64,/, "");
                } else if (req.body.profilepic.indexOf("data:image/jpeg") !== -1) {
                    base64Data = req.body.profilepic.replace(/^data:image\/jpeg;base64,/, "");
                }

                if (typeof base64Data == 'undefined') {
                    res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
                } else if (base64Data != "") {
                    require("fs").writeFile(profileFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    userObj['profilepic'] = profilepicfilename;
                }
            } else if (key == 'portfolioImage' && req.body.portfolioImage != "") {
                newPortfolioImagesArr = await updateMultipleImage(req.body.portfolioImage, oldPortfolioImagesArray);
            } else if (key == 'deleted_images' && req.body.deleted_images != "") {
                req.body.deleted_images.forEach(element => {
                    deletedPortfolioImages.push({ venue_image_src: element.replace(frontEnd.picPath + '/' + picture.showPortfolioPicFolderPath, '') });
                });
            } else {
                userObj[key] = req.body[key];
            }
        }
        const portfolioImagesDetailsArr = oldPortfolioImagesArray.concat(newPortfolioImagesArr);
        deletedPortfolioImages.forEach(item => {
            let removeIndex = findIndexByName(item.venue_image_src, portfolioImagesDetailsArr);
            if (removeIndex != -1) {
                portfolioImagesDetailsArr.splice(removeIndex, 1);
            }
        });
        userObj['portfolioImage'] = portfolioImagesDetailsArr;
        const updateData = Object.assign({}, userObj);
        userService.updateUser(req.params.userid, updateData).then(updatedUser => {
            res.json({ message: "Data Updated Successfully", data: updatedUser });
        });
    } catch (error) {
        console.log(error);
        res.json({ message: error });
    }
});
function findIndexByName(name, arrayName) {
    let index = -1;
    for (let i = 0; i < arrayName.length; i++) {
        if (arrayName[i].venue_image_src === name) {
            index = i;
            break;
        }
    }
    return index;
}
async function getOldImagesArray(venueImageDetails) {
    let oldImagesArr = [];
    venueImageDetails.forEach(element => {
        image = element.venue_image_src;
        imageDetails = image.replace(frontEnd.picPath + api.port + '/' + picture.showPortfolioPicFolderPath, '');
        oldImagesArr.push({ venue_image_src: imageDetails, alt: element.alt, default: element.default });

    });
    return oldImagesArr;
}
/** Update Decor image function */
async function updateMultipleImage(decorImage, oldImagesArr) {
    if (decorImage) {
        let newImagesArr = [];
        decorImage.forEach(element => {
            const bannerData = element.file;
            const fileType = bannerData.match(/[^:/]\w+(?=;|,)/)[0];
            updatedDecorFile = uuidv1() + "." + fileType;
            portfolioPath = picture.portfolioPicFolder + updatedDecorFile;
            let decorImageFilename = "";
            decorImageFilename = __dirname + "/../../../" + portfolioPath;

            var base64Data;
            if (bannerData.indexOf("data:image/png;") !== -1) {
                base64Data = bannerData.replace(/^data:image\/png;base64,/, "");
            } else if (bannerData.indexOf("data:image/jpg;") !== -1) {
                base64Data = bannerData.replace(/^data:image\/jpg;base64,/, "");
            } else if (bannerData.indexOf("data:image/jpeg") !== -1) {
                base64Data = bannerData.replace(/^data:image\/jpeg;base64,/, "");
            }

            if (typeof base64Data == 'undefined') {
                res.json({ message: "Only png, jpg, jpeg files are allowed!!" });
            } else if (base64Data != "") {
                let isFounded = oldImagesArr.includes(decorImageFilename);
                if (isFounded === false) {
                    require("fs").writeFile(decorImageFilename, base64Data, 'base64', function (err) {
                        console.log(err);
                    });
                    newImagesArr.push({ venue_image_src: updatedDecorFile, alt: element.alt, default: element.default });
                }
            }
        });
        return newImagesArr;
    }

}
//Delete Content
router.delete("/:userid", auth, async (req, res) => {
    try {
        const removeUser = await userService.deleteUser(req.params.userid);
        res.json({ message: "Data Deleted Successfully" });
    } catch (error) {
        res.json({ message: error });
    }
});
router.post('/request-pass', (req, res) => {
    const domainname = req.headers.origin;
    const { email } = req.body;
    authService.requestPassword(email)
        .then(user => {
            // .then((user) => {
            if (user) {
                res.send({ message: `Email with reset password instructions was sent to email ${email}.` })
            } else {
                res.send({ errors: `User not found. Please check your email address` });
            }
        })
        .catch((error) => {
            res.status(400).send({ data: { errors: error.message } });
        });

});
router.post('/reset-pass', (req, res) => {
    let key = cipher.decipherResetPasswordToken(req.body.reset_password_token);
    //let key = crypto.createDecipheriv(algorithm, secret, iv);
    // let token = key.update(req.body.reset_password_token, outputEncoding, inputEncoding)
    // token += key.final(inputEncoding);
    // let obj = JSON.parse(token);
    const id = key.userId;
    const { password, confirmPassword, reset_password_token } = req.body;

    authService
        .resetPassword(password, confirmPassword, id, req.body.reset_password_token)
        .then(() => res.send({ message: 'ok' }))
        .catch(err => {
            res.status(400).send({ error: err.message });
        });
});

module.exports = router;