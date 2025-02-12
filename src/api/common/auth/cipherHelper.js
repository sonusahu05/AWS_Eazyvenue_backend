const crypto = require('crypto');
const config = require('config');
const jwt = require('jsonwebtoken');
const { userInfo } = require('os');
const jwt_decode = require("jwt-decode");

const {
    secret, ttl, algorithm, inputEncoding, outputEncoding,
} = config.get('auth.resetPassword');

function genRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

function getStringValue(data) {
    if (typeof data === 'number' || data instanceof Number) {
        return data.toString();
    }
    if (!Buffer.isBuffer(data) && typeof data !== 'string') {
        throw new TypeError('Data for password or salt must be a string or a buffer');
    }
    return data;
}

function getUserFromToken(req) {
    const authHeader = String(req.headers['authorization'] || '');
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        var userInfo = jwt_decode(token);
        return userInfo.id;
    }
}

function getUserRoleFromToken(req) {
    const authHeader = String(req.headers['authorization'] || '');
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        var userInfo = jwt_decode(token);
        return userInfo.rolename;
    }
}

function sha512(password, salt) {
    const hash = crypto.createHmac('sha512', getStringValue(salt));
    hash.update(getStringValue(password));
    const passwordHash = hash.digest('hex');
    return {
        salt,
        passwordHash,
    };
}

function saltHashPassword(password) {
    const salt = genRandomString(16);
    return sha512(getStringValue(password), salt);
}

function generateResetPasswordToken(userId) {
    const text = JSON.stringify({ userId, valid: new Date().getTime() + ttl });
    const cipher = crypto.createCipher(algorithm, secret);
    let ciphered = cipher.update(text, inputEncoding, outputEncoding);
    ciphered += cipher.final(outputEncoding);
    return ciphered;
}

function decipherResetPasswordToken(ciphered) {
    const decipher = crypto.createDecipher(algorithm, secret);
    let deciphered = decipher.update(ciphered, outputEncoding, inputEncoding);
    deciphered += decipher.final(inputEncoding);
    return JSON.parse(deciphered);
}

function generateResponseTokens(user,type) {
    var normalizedUser;
    if(type=='all') {
        normalizedUser = { id: user.id, role: user.role, rolename: user.rolename, email: user.email, 
        firstname:user.firstName, lastname:user.lastName, fullName:user.fullName, status:user.status, 
        profilepic:user.profilepic, timeZone: user.timeZone, timeOffset: user.timeZoneOffset, mobile: user.mobile };
    } else if(type=='user') {
        normalizedUser = { id: user._id, role: user.role, rolename: user.rolename, email: user.email, 
        firstname:user.firstName, lastname:user.lastName, fullName:user.fullName, status:user.status, 
        profilepic:user.profilepic, timeZone: user.timeZone, timeOffset: user.timeZoneOffset, mobile: user.mobile };
    }
    
    else if(type='venueowner') {        
        normalizedUser = { id: user._id, role: user.roledetail[0]['_id'], rolename: user.roledetail[0]['user_role_name'], email: user.email, 
            firstname:user.firstName, lastname:user.lastName, fullName:user.fullName, status:user.status, 
            profilepic:user.profilepic, timeZone: user.timeZone, timeOffset: user.timeZoneOffset, mobile: user.mobileNumber, venuename: user.venuedetail[0]['name'], 
            venuename: user.venuedetail[0]['name'] };
    }
    const accessToken = jwt.sign(
        normalizedUser,
        config.get('auth.jwt.accessTokenSecret'),
        { expiresIn: config.get('auth.jwt.accessTokenLife') },
    );
    const refreshToken = jwt.sign(
        normalizedUser,
        config.get('auth.jwt.refreshTokenSecret'),
        { expiresIn: config.get('auth.jwt.refreshTokenLife') },
    );

    return {
        expires_in: config.get('auth.jwt.accessTokenLife'),
        access_token: accessToken,
        refresh_token: refreshToken,
	      userdata:normalizedUser
    };
}

module.exports = {
    saltHashPassword,
    sha512,
    generateResetPasswordToken,
    decipherResetPasswordToken,
    generateResponseTokens,
    getUserFromToken,
    getUserRoleFromToken
};
