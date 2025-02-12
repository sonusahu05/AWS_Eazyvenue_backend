const express = require('express');
const passport = require('passport');
const cipher = require('../auth/cipherHelper');
const AuthService = require('./authService');
const router = express.Router();
const authService = new AuthService();
const auth = passport.authenticate('jwt', { session: false });
const RoleService = require('./../role/roleService');
const UserService = require('./../user/userService');
const RoleRepository = require('../role/roleRepository');
const roleRepository = new RoleRepository();
const UserRepository =  require('../user/userRepository');
const userRepository =  new UserRepository();
const { sendNewRegistrationMail,sendLoginMailToSales } = require("../../../utils/mail");
//const RoleService = require('./../../userrole/userroleService');
// router.post('/login', (req, res) => {
//     passport.authenticate('local', { session: false }, async (err, user) => {
//         if (err || !user) {
//             var err = err ? err.message : 'Please check your login credentials';
//             return res.status(401).send({ data: { message: err } });
//         }
//         req.login(user, { session: false }, async (error) => {
//             if (error) {
//                 res.send(error);
//             }
//             const roleService = new RoleService();
//             const role = await roleService.findByRoleName(req.body.type);
//             if (req.body.type != 'venueowner' && role.length > 0 && role[0]._id.equals(user.role) && user.status == true && user.disable == false) {
//                 const response = { data: cipher.generateResponseTokens(user,'all') };
//                 res.send(response);
//             } else if (req.body.type == 'venueowner' && role.length > 0 && role[0]._id.equals(user.role) && user.status == true && user.disable == false) {
//                 const userService = new UserService();
//                 const userdetails = await userService.getVenueOwner(user.id);                
//                 const response = { data: cipher.generateResponseTokens(userdetails,'venueowner') };
//                 res.send(response);
//             } else {
//                 res.status(400).send({ data: { message: "User may not exist or in case of query please contact Administrator admin@eazyvenue.com" } });
//             }       
//         });
// })(req, res);
// });
// router.post('/newLogin',passport.authenticate('local', { session: false }), async (req,res) =>{
//     try{
//         if (!req.user) {
//             return res.status(401).send({ data: { message: 'Please check your login credentials' } });
//         }
//         res.status(200).send({data: req.user})
//     }catch(error){
//         res.status(500).send({ data: { message: error.message } });
//     }
// })
router.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).send({ data: { message: 'Please check your login credentials' } });
        }

        // const { type } = req.body;
        // console.log(req.user);
        const type  = req.user.rolename;
        const roleService = new RoleService();
        const role = await roleService.findByRoleName(type);
        console.log(type);
        const isValidUser = role.length > 0 &&
            role[0]._id.equals(req.user.role) &&
            req.user.status === true &&
            req.user.disable === false;
        
       if (type === 'venueowner' && isValidUser) {
            const userService = new UserService();
            const userdetails = await userService.getVenueOwner(req.user.id);
            res.send({ data: cipher.generateResponseTokens(userdetails, 'venueowner') });
        } else if (type !== 'venueowner' && isValidUser) {
            res.send({ data: cipher.generateResponseTokens(req.user, 'all') });
        } else  {
            res.status(400).send({ data: { message: "User may not exist or in case of query, please contact Administrator admin@eazyvenue.com" } });
        }
    } catch (error) {
        res.status(500).send({ data: { message: error.message } });
    }
});

router.post('/sign-up', (req, res) => {
    authService
        .register(req.body)
        .then(user => {
            //console.log("response user", user);
            const response = { token: cipher.generateResponseTokens(user, 'all'), userData: user };
            res.send(response);
        })
        .catch(err => res.status(400).send({ error: err.message }));
});
router.post('/reset-pass', auth, (req, res) => {
    const { id } = req.user;
    const { password, confirmPassword, resetPasswordToken } = req.body;
    authService
        .resetPassword(password, confirmPassword, id, resetPasswordToken)
        .then(() => res.send({ message: 'ok' }))
        .catch(err => {
            res.status(400).send({ error: err.message });
        });
});
router.post('/request-pass', (req, res) => {
    const { email } = req.body;
    authService
        .requestPassword(email)
        .then(() => res.send({ message: `Email with reset password instructions was sent to email ${email}.` }))
        .catch((error) => {
            res.status(400).send({ data: { errors: error.message } });
        });
});
router.post('/sign-out', (req, res) => {
    res.send({ message: 'ok' });
});
router.post('/refresh-token', (req, res) => {
    const token = req.body;
    authService
        .refreshToken(token)
        .then(tokens => res.send(tokens))
        .catch(err => res.status(400).send({ error: err.message }));
});


router.post('/sendOtp', (req, res) => {
    try {
        authService.generateMobileOtp(req.body.mobileNumber).then((user) => {
            const {otp,mobileNumber} = user.data;
            if (user) {
                res.status(201).json({ 
                    message: 'OTP Generated Successfully.', 
                    id:user.data._id,
                    firstName: user.data.firstName,
                    lastName: user.data.lastName, 
                    otp,mobileNumber 
                });
            } else {
                res.status(400).send( { error: 'System Error, Please try again.' });
            }

        }).catch((err)=>res.status(400).json({message: err.message}));
    } catch (err) {
        res.status(400).json({message: err.message});
    }
});


router.post('/verifyOtp', (req, res) => {
    const {mobileNumber} = req.body;
    let newUserFlag = false;
    if(!mobileNumber || mobileNumber===''){
      return  res.status(400).send( { error: 'Please enter valid  mobile number' });

    }
    authService
        .verifyOtp(req.body)
        .then(async user => {
            const userService = new UserService();

            let updateData = {
                "status": true,                
            }
            if(user.data.firstName == undefined || user.data.firstName == ''){
                newUserFlag = true;
                updateData = {
                    "status": true,              
                    'firstName': req.body.firstName,
                    'lastName':req.body.lastName,
                }
            }
            await userService.updateUser(user.data._id, updateData).then(updatedUser => {
            });
            var userdetails = await userService.getVenueOwner(user.data._id); 
            let response = { data: cipher.generateResponseTokens(userdetails,'user') };
            let newResonse = {    
                ...response,
                
            }

            const role = await roleRepository.getRoleByName('user');
            const userData =await userRepository.findByMobile(req.body.mobileNumber);
            newResonse.data.userdata.rolename =   newResonse.data.userdata.rolename ?   response.data.userdata.rolename: role[0].user_role_name
            newResonse.data.userdata.role = response.data.userdata.role ? response.data.userdata.role :role[0]._id
            newResonse.data.userdata.id = response.data.userdata.id ? response.data.userdata.id :userData._id;
            if(newUserFlag){
                //send email to info and anchal, deep and pooja
                const data = {
                    firstName : req.body.firstName,
                    lastName :req.body.lastName,
                    mobileNumber: mobileNumber, 
                }
                sendNewRegistrationMail(data);
            }else{
                const data = {
                    firstName : userData.firstName,
                    lastName :userData.lastName,
                    mobileNumber: mobileNumber, 
                }
                sendLoginMailToSales(data);       

            }
            res.send(newResonse);
        })
        .catch(err => {
            res.status(404).json({message: err.error});
        });
});
module.exports = router;