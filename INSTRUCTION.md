# ngx-admin Backend Bundle Node instruction


## Intro

This is readme and instructions how start using node backend bundle from Akveo. Backend bundle is integrated solution of Node Backend Code and Angular Frontend code. Backend code plays mostly API role, giving data to the client side as REST API. 

## Running Instruction

1) install mongoDB locally or register mongoDB in some hosting. in case of local node run command: `mongod` in separate terminal

2) setup connection to mongoDB in `config/default.js`

```
db: {
url: 'mongodb://localhost:27017/bundle-node',
name: 'bundle-node',
},
```

2) in folder `backend` run commands
```
npm install
npm start
```

test that node api is running by opening `http://localhost:3001/api` 

3) in folder `frontend` run commands
```
npm install
npm start
```

4) run `http://localhost:4200`

5) create new user using interface and start working with app

## Test User / Password

You can use these test users for application testing:

1. user@user.user / 12345
2. admin@admin.admin / !2e4S

## Development

While developing node.js api we suggest to use `npm run dev` command, because it runs `nodemon` module to watch over changes and re-run node api automatically.

## API Documentation

You can check API documentation by running api and accessing http://localhost:3001/api/swagger link.

To use swagger with token authentication please follow these steps:
 - open swagger link `http://localhost:3001/api/swagger` while running api
 - expand `**Auth**` controller and open `POST /auth/login` action
 - click `try out` and put correct user info into loginDto field (there is sample in swagger). Click `execute`
 - when received response with token, copy token `access_token` (ctrl+c)
 - click `Authorize` button. Paste there token in format: `Bearer <token>` and click `Authorize`
 - after UI was refreshed, you can try any requests, token will be added there

## Basic Code Structure

Code is organized in following structure

 - Main Folder
    - frontend // this folder contains all UI code
    - backend // server side node.js code
        - config // all configuration is here
        - src
            - api // api implementation, controllers, services, ... 
            - db // mongoDB client handling
            - utils 
            - app.js // routing and api setup
            - passport.js // auth implementation is here
    - docs // documentation and licenses

## Tech Stack

This Code Bundle has backend and frontend parts.

Backend Part uses following libraries and frameworks:

- Express server
- MongoDB
- Passport Authentication using JWT tokens
- winston is used for logging
- node-config is used for configure application settings
- eslint for code style checking
- nodemon is used for better experience while develop

Frontend Part is basically Angular project with following stack:

 - Angular 8.0.0
 - RxJs 6.5.2
 - Nebular 4.1.2
 - Eva-icons 1.1.0
 - Typescript 3.4.5
 - ...

Frontend part is based on the latest ngx-admin dashboard template, but with edited UI components and service layer for data getting. Bundle UI supports both data from API and mock data, you can switch it inside file `core.module.ts` by editing `NB_CORE_PROVIDERS` collection.

## Support

Please post issues in [Bundle Support Issue Tracker](https://github.com/akveo/ngx-admin-bundle-support/issues)
