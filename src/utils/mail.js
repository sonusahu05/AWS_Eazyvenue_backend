const nodemailer = require('nodemailer');
const ejs = require('ejs');
const axios = require('axios')

const sendCheckAvailibilityMail = async(data) =>{
    try{
        const mailData = {
            ...data
        }
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'book@eazyvenue.com',
                pass: 'vhicrlcjueqiikew',
            }
        });
        let htmlData = await ejs.renderFile(__dirname+'/emailTemplates/check_availibility.ejs', mailData);
        var mailOptions = {
            from: 'book@eazyvenue.com',
            // to: ['maathesh@eazyvenue.com','krutik.d@eazyvenue.com','kalambe125@gmail.com'],
            to: [data.to],
            subject: "Check Availibility - Eazyvenue.com",
            html: htmlData,
            replyTo: 'book@eazyvenue.com'
        }

        transporter.sendMail(mailOptions, (error,info) =>{
            if(error){
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
        })
        console.log("end of mail func");
    }catch(error){
        console.log(error);
    }
}
const sendVenueBookingMail = async(data) =>{
    try{
        const mailData = {
            ...data
        }
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'book@eazyvenue.com',
                pass: 'vhicrlcjueqiikew',
            }
        });
        let htmlData = await ejs.renderFile(__dirname+'/emailTemplates/venue_booking.ejs', mailData);
        var mailOptions = {
            from: 'book@eazyvenue.com',
            // to: ['maathesh@eazyvenue.com','krutik.d@eazyvenue.com','kalambe125@gmail.com'],
            to: [data.to],
            subject: "Booking Confirmation - Eazyvenue.com",
            html: htmlData,
            replyTo: 'book@eazyvenue.com'
        }

        transporter.sendMail(mailOptions, (error,info) =>{
            if(error){
                return console.log(error);
            }
            console.log('Booking Message sent: %s', info.messageId);
        })
        console.log("end of mail func");
    }catch(error){
        console.log(error);
    }
}

const sendNewRegistrationMail = async(data) =>{
    try{
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'book@eazyvenue.com',
                pass: 'vhicrlcjueqiikew',
            }
        });
        var mailOptions = {
            from: 'book@eazyvenue.com',
            to: ['info@eazyvenue.com'],
            subject: "New User Registration Alert - Eazyvenue Team",
            text: `
Dear Sales Team,

I hope this message finds you well. We're excited to share that a New user has been generated on our site, 
expressing interest in our banquet hall services.A promising lead awaits your attention.

Inquiry Details:
Name: ${data.firstName} ${data.lastName}
Phone Number: ${data.mobileNumber}

Best Regards,
Team Eazyvenue
            `,
            cc: ['pooja.yadav@eazyvenue.com','Deep.Seth@eazyvenue.com','Anchal@eazyvenue.com'],
            // cc: ['maathesh@eazyvenue.com','ashutosh.kalambe@eazyvenue.com','niraj.pal@eazyvenue.com'],
            replyTo: 'book@eazyvenue.com'
        }
       
        let crmData = {
            "Lead Name": data.firstName+" "+data.firstName,
            "Number of Guest": "0",
            "Preferred Location": "NA",
            "Type of Event": "NA",
            "Date of Event": "01-01-2024",
            "Menu": "NA",
            "Venue": "NA",
            "Number": data.mobileNumber.toString(),
            "Email": "",
            "Requirement": data.firstName+" "+data.firstName + ", Mobile: "+data.mobileNumber.toString(),
            "User_Action" : 'new_registration'
        }
        
        axios.post('https://teleduce.corefactors.in/lead/apiwebhook/e355659f-b2da-4d96-8899-14c11ae71fa7/Eazyvenuecom/',crmData).then((data)=>{
            console.log('New Registration Added');
        }).catch((e)=>{
            console.error(e);
        });
        transporter.sendMail(mailOptions, (error,info) =>{
            if(error){
                console.log(error.message);
            }
            console.log('Message sent: %s', info.messageId);
        })
        console.log("end of mail func");
    }catch(error){
        console.log(error);
    }
}

const sendLoginMailToSales = async(data) =>{
    try{
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'book@eazyvenue.com',
                pass: 'vhicrlcjueqiikew',
            }
        });
        var mailOptions = {
            from: 'book@eazyvenue.com',
            to: ['info@eazyvenue.com'],
            subject: "User Login Alert - Eazyvenue Team",
            text: `
Dear Sales Team,

I hope this message finds you well. We're excited to share that a user has just logged in on our site, 
expressing interest in our banquet hall services.A promising lead awaits your attention.

Inquiry Details:
Name: ${data.firstName} ${data.lastName}
Phone Number: ${data.mobileNumber}

Best Regards,
Team Eazyvenue
            `,
            cc: ['pooja.yadav@eazyvenue.com','Deep.Seth@eazyvenue.com','Anchal@eazyvenue.com'],
            // cc: ['maathesh@eazyvenue.com','ashutosh.kalambe@eazyvenue.com','niraj.pal@eazyvenue.com'],
            replyTo: 'book@eazyvenue.com'
        }

        // const crmData = {
        //     "Lead Name" : data.firstName + ' ' + data.lastName,
        //     "Number of Guest" : 0,
        //     "Preferred Location" : "NA",
        //     "Type of Event" : "NA",
        //     "Menu" : "NA",
        //     "Venue" : "NA",
        //     "Number" : data.mobileNumber, 
        //     "Email" : "",
        //     "Requirement": data.firstName + ' ' + data.lastName + ", Mobile: " + data.mobileNumber,
        //     "User_Action" : 'user_login'
        // }

        let crmData = {
            "Lead Name": data.firstName+" "+data.firstName,
            "Number of Guest": "0",
            "Preferred Location": "NA",
            "Type of Event": "NA",
            "Date of Event": "01-01-2024",
            "Menu": "NA",
            "Venue": "NA",
            "Number": data.mobileNumber.toString(),
            "Email": "",
            "Requirement": data.firstName+" "+data.firstName + ", Mobile: "+data.mobileNumber.toString(),
            "User_Action": "user_login"
        }

        axios.post('https://teleduce.corefactors.in/lead/apiwebhook/e355659f-b2da-4d96-8899-14c11ae71fa7/Eazyvenuecom/',crmData).then((data)=>{
            console.log('User Login Added');
        }).catch((e)=>{
            console.error(e);
        });
        transporter.sendMail(mailOptions, (error,info) =>{
            if(error){
                console.log(error.message);
            }
            console.log('Message sent: %s', info.messageId);
        })
        console.log("end of mail func");
    }catch(error){
        console.log(error);
    }
}

module.exports = {
    sendCheckAvailibilityMail,sendNewRegistrationMail,sendVenueBookingMail,sendLoginMailToSales
};