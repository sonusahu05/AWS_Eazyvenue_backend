const passport = require('passport');
// const refresh = require('passport-oauth2-refresh')
const LocalStrategy = require('passport-local').Strategy;
// const OAuth2Strategy = require('passport-oauth2');
// const OAuth2RefreshTokenStrategy = require('passport-oauth2-middleware').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const config = require('config');
const cipher = require('./api/common/auth/cipherHelper');
const UserService = require('./api/common/user/userService');
const userService = new UserService();
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
},
(email, password, cb) => {
  userService
      .findByEmail(email)
      .then(user => {
          const { passwordHash } = cipher.sha512(password, user.salt);
          if (!user || user.passwordHash !== passwordHash) {
          return cb(null, false, { message: 'Incorrect utils or password.' });
      }
      
      return cb(null, { id: user._id, role: user.role, rolename: user.roledata[0].user_role_name, email:user.email, 
        profilepic:user.profilepic, firstName:user.firstName, lastName:user.lastName, fullName:user.fullName, status:user.status, 
        disable:user.disable, timeZone:user.timeZone, timeZoneOffset: user.timeZoneOffset, mobile: user.mobileNumber }, 
        { message: 'Logged In Successfully' });
      })
      .catch(() => cb(null, false, { message: 'Incorrect utils or password.' }));
}));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.get('auth.jwt.accessTokenSecret'),
},
(jwtPayload, cb) => {
  userService.findById(jwtPayload.id).then(data=>{    
    if(data.id !==undefined){
      return cb(null, jwtPayload);
    }else{
      cb(null, false, { message: 'Invalid.' });
    }
  })  
}));