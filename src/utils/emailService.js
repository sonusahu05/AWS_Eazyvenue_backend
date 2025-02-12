const config = require('config');
const logger = require('../utils/logger');
const { domain } = config.get('frontEnd');
const nodemailer = require('nodemailer');
const path = require('path');
function doSend(email, text) {
    logger.infoLog.info(text);
    sendEmail(email, 'Reset Password', text);
    return Promise.resolve(true);
}

function sendResetPasswordEmail(email, fullName, token) {
    const text = `Hello ${fullName},`
        + '\nWe have received password reset request. '
        + `To do this, please proceed at <a href="${domain}/auth/reset-pass/${token}">${domain}/auth/reset-pass/${token}</a>`
        + '\nIf it wasn\'t you, take no action or contact support.'
        + '\n\nThank you,'
        + '\nSupport team.';

    return doSend(email, text);
}

function sendEmail(to, subject, message, attachments) {

    let transporter = nodemailer.createTransport({
        host: config.mail.smtpHost,
        port: config.mail.port,
        auth: {
            user: config.mail.userName,
            pass: config.mail.password
        },
        secureConnection: false,

    });
    const mailOptions = {
        from: config.mail.fromEmailId,
        to: to,
        subject: subject,
        html: message,

    };
    transporter.sendMail(mailOptions, function (err, info) {

        if (err) {

            console.log('error', err)
        } else {
            //console.log(info);
            console.log("Email Sent Successfully");
        }
    });
}


const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'monica.schiller@ethereal.email',
        pass: 'QCcQkQTg65Gt3MDekG'
    }
});


module.exports = {
    sendResetPasswordEmail, sendEmail, transporter
};