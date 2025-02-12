const jwt = require('jsonwebtoken');
const config = require('config');
let moment = require('moment');
const UserService = require('../user/userService');
const cipher = require('./cipherHelper');
const emailService = require('../../../utils/emailService');
const RoleService = require('../../common/role/roleService');
const roleService = new RoleService();
const { ObjectId } = require('mongodb');
const User = require('../../../../model/User');
const RoleRepository = require('../role/roleRepository');
const roleRepository = new RoleRepository();
const axios = require('axios').default;

const {
    secret, ttl, algorithm, inputEncoding, outputEncoding,
} = config.get('auth.resetPassword');
class AuthService {
    constructor() {
        this.userService = new UserService();
    }

    // generateMobileOtp(mobileNumber) {
    //     try {
    //         if (mobileNumber) {
    //             return Promise.all(
    //                 [
    //                     this.userService.findByMobile(mobileNumber).then(async (userData) => {
    //                 const role = await roleRepository.getRoleByName('user');
    //                 if (userData != '') {
    //                     let date = new Date();
    //                     const now = new Date();
    //                     const expiration_time = moment(now)
    //                         .add(90, 'seconds');
    //                     if (Number(mobileNumber) != Number(userData.mobileNumber)) {
    //                         return Promise.reject({ error: 'Invalid Mobile Number.' });
    //                     } else {
    //                         let otp = await this.generateOTP();

    //                         let userUpdatedData = {
    //                             otp: Number(otp),
    //                             updated_at: date,
    //                             updated_by: ObjectId(userData._id),
    //                             otp_expiration_time: expiration_time.toDate(),
    //                             role: ObjectId(role[0]._id)
    //                         }



    //                         let sendOtp = await axios.post(`${config.get('sms.smsapi')}?username=${config.get('sms.username')}&password=${config.get('sms.password')}&from=${config.get('sms.from')}&to=91${mobileNumber}&indiaDltContentTemplateId=${config.get('sms.indiaDltContentTemplateId')}&indiaDltPrincipalEntityId=${config.get('sms.indiaDltPrincipalEntityId')}&text=Dear Customer, Your OTP for EazyVenue login is ${otp}. Explore Unlimited Venues.`)


    //                         const checkRejected = sendOtp.data.messages[0].status;

    //                         if (checkRejected.name === 'REJECTED_PREFIX_MISSING') {
    //                             return Promise.reject({ error: 'REJECTED PREFIX MISSING' });
    //                         }

    //                         await this.userService.updateUser(userData._id, userUpdatedData).then((res) => {
    //                             return Promise.resolve({ success: 'OTP Generated.' });
    //                         }).catch(err => {
    //                             return Promise.reject({ error: 'System Error, Please try again.' });
    //                         });
    //                     }
    //                 } else {
                    
    //                     let date = new Date();

    //                     const now = new Date();
    //                     const expiration_time = moment(now)
    //                         .add(90, 'seconds');

    //                     let otp = await this.generateOTP();
    //                     let userAdddData = {
    //                         mobileNumber: mobileNumber,
    //                         otp: Number(otp),
    //                         updated_at: date,
    //                         disable: false,
    //                         updated_by: ObjectId(userData._id),
    //                         otp_expiration_time: expiration_time.toDate(),
    //                         role: ObjectId(role[0]._id)
    //                     }
    //                     // await emailService.transporter.sendMail({
    //                     //     from: '"wianTech 👻" <hrWianTech@.com>', 
    //                     //     to: `${mobileNumber}`, 
    //                     //     subject: "Hello ✔", 
    //                     //     text: "Hello world?", 
    //                     //     html: `Your One Time Otp has send to your email. Please enter  ${otp} to verify to account`, 
    //                     // });

    //                     let sendOtp = await axios.post(`${config.get('sms.smsapi')}?username=${config.get('sms.username')}&password=${config.get('sms.password')}&from=${config.get('sms.from')}&to=91${mobileNumber}&indiaDltContentTemplateId=${config.get('sms.indiaDltContentTemplateId')}&indiaDltPrincipalEntityId=${config.get('sms.indiaDltPrincipalEntityId')}&text=Dear Customer, Your OTP for EazyVenue login is ${otp}. Explore Unlimited Venues.`)

    //                     const checkRejected = sendOtp.data.messages[0].status;

    //                     if (checkRejected.name === 'REJECTED_PREFIX_MISSING') {
    //                         return Promise.reject({ error: 'REJECTED PREFIX MISSING' });
    //                     }


    //                     await this.userService.addUser(userAdddData)

    //                     return Promise.resolve({ success: 'OTP Generated.' });
    //                 }
    //             }).then(async response => { return await this.userService.findByMobile(mobileNumber) })
    //         ]).then(([data]) => {
    //                 return { data }
    //             });
    //         }
    //     } catch (err) {
    //         return Promise.reject(err);
    //     }

    // }

    generateMobileOtp(mobileNumber) {
        try {
            if (mobileNumber) {
                return Promise.all([
                    this.userService.findByMobile(mobileNumber).then(async (userData) => {
                        const role = await roleRepository.getRoleByName('user');
                        let userUpdatedData = {}; // Initialize the userUpdatedData object
    
                        if (userData != '') {
                            let date = new Date();
                            const now = new Date();
                            const expiration_time = moment(now).add(90, 'seconds');
    
                            if (Number(mobileNumber) != Number(userData.mobileNumber)) {
                                return Promise.reject({ error: 'Invalid Mobile Number.' });
                            } else {
                                let otp = await this.generateOTP();
    
                                userUpdatedData = {
                                    otp: Number(otp),
                                    updated_at: date,
                                    updated_by: ObjectId(userData._id),
                                    otp_expiration_time: expiration_time.toDate(),
                                    role: ObjectId(role[0]._id),
                                    firstName: userData.firstName || '', // Include firstName
                                    lastName: userData.lastName || '',   // Include lastName
                                };
    
                                let sendOtp = await axios.post(`${config.get('sms.smsapi')}?username=${config.get('sms.username')}&password=${config.get('sms.password')}&from=${config.get('sms.from')}&to=91${mobileNumber}&indiaDltContentTemplateId=${config.get('sms.indiaDltContentTemplateId')}&indiaDltPrincipalEntityId=${config.get('sms.indiaDltPrincipalEntityId')}&text=Dear Customer, Your OTP for EazyVenue login is ${otp}. Explore Unlimited Venues.`);
    
                                const checkRejected = sendOtp.data.messages[0].status;
    
                                if (checkRejected.name === 'REJECTED_PREFIX_MISSING') {
                                    return Promise.reject({ error: 'REJECTED PREFIX MISSING' });
                                }
    
                                await this.userService.updateUser(userData._id, userUpdatedData).then(() => {
                                    return Promise.resolve({ success: 'OTP Generated.', data: userUpdatedData });
                                }).catch(() => {
                                    return Promise.reject({ error: 'System Error, Please try again.' });
                                });
                            }
                        } else {
                            let date = new Date();
                            const now = new Date();
                            const expiration_time = moment(now).add(90, 'seconds');
    
                            let otp = await this.generateOTP();
                            userUpdatedData = {
                                mobileNumber: mobileNumber,
                                otp: Number(otp),
                                updated_at: date,
                                disable: false,
                                updated_by: ObjectId(userData._id),
                                otp_expiration_time: expiration_time.toDate(),
                                role: ObjectId(role[0]._id),
                                firstName: '', // Include firstName
                                lastName: '',  // Include lastName
                            };
    
                            let sendOtp = await axios.post(`${config.get('sms.smsapi')}?username=${config.get('sms.username')}&password=${config.get('sms.password')}&from=${config.get('sms.from')}&to=91${mobileNumber}&indiaDltContentTemplateId=${config.get('sms.indiaDltContentTemplateId')}&indiaDltPrincipalEntityId=${config.get('sms.indiaDltPrincipalEntityId')}&text=Dear Customer, Your OTP for EazyVenue login is ${otp}. Explore Unlimited Venues.`);
    
                            const checkRejected = sendOtp.data.messages[0].status;
    
                            if (checkRejected.name === 'REJECTED_PREFIX_MISSING') {
                                return Promise.reject({ error: 'REJECTED PREFIX MISSING' });
                            }
    
                            await this.userService.addUser(userUpdatedData);
    
                            return Promise.resolve({ success: 'OTP Generated.', data: userUpdatedData });
                        }
                    }).then(async response => { return await this.userService.findByMobile(mobileNumber) })
                ]).then(([data]) => {
                    return { data };
                });
            }
        } catch (err) {
            return Promise.reject(err);
        }
    }    
    
    
    async sendOtpViaSms(mobileNumber, otp) {
        return axios.post(`${config.get('sms.smsapi')}?username=${config.get('sms.username')}&password=${config.get('sms.password')}&from=${config.get('sms.from')}&to=91${mobileNumber}&indiaDltContentTemplateId=${config.get('sms.indiaDltContentTemplateId')}&indiaDltPrincipalEntityId=${config.get('sms.indiaDltPrincipalEntityId')}&text=Dear Customer, Your OTP for EazyVenue login is ${otp}. Explore Unlimited Venues.`);
    }
    
    async generateOTP() {
        // Declare a digits variable 
        // which stores all digits
        let digits = '123456789';
        let OTP = '';
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 9)];
        }
        return OTP;
    }

    register(user) {
        const { email } = user;
        return Promise.all([this.userService.findByEmail(email)
            .then(existingUser => {
                if (existingUser != '') {
                    throw new Error('User already exists');
                }
                roleService.findByRoleName(user.userType).then(userRole => {
                    const role = userRole[0]._id;
                    const { salt, passwordHash } = cipher.saltHashPassword(user.password);
                    const newUser = {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        fullName: user.firstName + " " + user.lastName,
                        role: role,
                        mobileNumber: user.mobileNumber,
                        gender: user.gender,
                        dob: user.dob,
                        disable: false,
                        status: true,
                        salt,
                        passwordHash,
                        registerMode: user.registerFrom,
                    };
                    return this.userService.addUser(newUser).then(response => {
                        if (response.result.ok === 1) {
                            return this.userService.findByEmail(email);
                        }
                    });
                });
            }).then(response => { return this.userService.findByEmail(email) })]).then(([data]) => {
                return { data }
            });

    }

    resetPassword(password, confirmPassword, userId, resetPasswordToken) {
        let currentUserId = userId;
        if (password.length < 4) {
            return Promise.reject(new Error('Password should be longer than 4 characters'));
        }

        if (password !== confirmPassword) {
            return Promise.reject(new Error('Password and its confirmation do not match.'));
        }
        if (resetPasswordToken) {
            const tokenContent = cipher.decipherResetPasswordToken(resetPasswordToken);
            currentUserId = tokenContent.userId;
            if (new Date().getTime() > tokenContent.valid) {
                return Promise.reject(new Error('Reset password token has expired.'));
            }
        }
        const { salt, passwordHash } = cipher.saltHashPassword(password);
        return this.userService.changePassword(currentUserId, salt, passwordHash);
    }

    refreshToken(token) {
        if (!token.access_token || !token.refresh_token) {
            throw new Error('Invalid token format');
        }
        const tokenContent = jwt.decode(
            token.refresh_token,
            config.get('auth.jwt.refreshTokenSecret'),
            { expiresIn: config.get('auth.jwt.refreshTokenLife') },
        );
        return this.userService.findById(tokenContent.id).then(user => {
            return cipher.generateResponseTokens(user);
        });
    }

    requestPassword(email) {
        return this.userService
            .findByEmail(email)
            .then(user => {
                if (user._id) {
                    const token = cipher.generateResetPasswordToken(user._id);
                    return emailService.sendResetPasswordEmail(email, user.fullName, token);
                }
                throw new Error('There is no defined email in the system.');
            })
            .catch(error => {
                throw error;
            });
    }
    // verifyOtp(user) {
    //     try {
    //         let mobileNumber = user.mobileNumber;
    //         if (user.otp != '') {
    //             return Promise.all([this.userService.findByMobile(mobileNumber).then(async (userData) => {
    //                 if (userData != '') {
    //                     let otpExpirationTime = userData.otp_expiration_time;
    //                     let date = new Date();
    //                     let timeExpire = moment(date).isAfter(otpExpirationTime);
    //                     let userOtp = userData.otp;
    //                     if (timeExpire == true) {
    //                         return Promise.reject({ error: 'OTP is expired. Please resend OTP' });
    //                     } else {
    //                         if (Number(userOtp) == Number(user.otp)) {
    //                             //await this.requestPassword(userData.email);
    //                             return this.userService.findByEmail(mobileNumber);


    //                         } else {
    //                             return Promise.reject({ error: 'Invalid OTP. Please try again' });
    //                         }
    //                     }
    //                 } else {
    //                     return Promise.reject({ error: 'Mobile number is wrong.' });
    //                 }
    //             }).then(async response => { return await this.userService.findByMobile(mobileNumber) })]).then(([data]) => {
    //                 return { data }
    //             });
    //         }
    //     } catch (err) {
    //         return Promise.reject({error: err.message});
    //     }

    // }

    async verifyOtp(user) {
        try {
          const mobileNumber = Number(user.mobileNumber);
          if (!user.otp) {
            return Promise.reject({ error: 'OTP is required.' });
          }
      
          const userData = await this.userService.findByMobile(mobileNumber);
      
          if (!userData) {
            return Promise.reject({ error: 'Mobile number is wrong.' });
          }
          const otpExpirationTime = userData.otp_expiration_time;
          const isExpired = moment().isAfter(otpExpirationTime);
      
          if (isExpired) {
            return Promise.reject({ error: 'OTP is expired. Please resend OTP.' });
          }
          const userOtp = userData.otp;
          if (Number(userOtp) === Number(user.otp)) {
            // Your logic here, e.g., requestPassword
            const response = await this.userService.findByMobile(mobileNumber);
            return { data: response };
          } else {
            return Promise.reject({ error: 'Invalid OTP. Please try again.' });
          }
        } catch (err) {
          return Promise.reject({ error: err.message });
        }
      }
      
}


module.exports = AuthService;