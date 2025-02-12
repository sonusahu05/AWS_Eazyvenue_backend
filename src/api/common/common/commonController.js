const express = require('express');
const router = express.Router();
const { adminGuard } = require('../auth/aclService');
const Country = require("../../../../model/Country");
const State = require("../../../../model/State");
const City = require("../../../../model/City");
const CustomErrorService = require('../../../utils/customErrorService');
const CommonService = require('./commonService');
const commonService = new CommonService();

router.get('/country', async (req, res) => {
    try {
        // const countries = await Country.find({},{_id: 1, name: 1, iso3: 1, iso2: 1});  
        // res.json({totalCount:countries.length, data: countries});
        const data = await commonService.getCountry();  
        res.json({data});
    } catch (error) {
        res.json({ message: error});
    }
});

router.get('/currency', async (req, res) => {
    try {
        
        const data = await commonService.getCurrency();  
        res.json({data});
    } catch (error) {
        res.json({ message: error});
    }
});

router.get("/states/:countrycode", async (req, res)=> { 
  try {
        // const states = await State.find({'country_code': req.params.countrycode}, {_id:1, name:1, state_code:1});  
        // res.json({totalCount:states.length, data: states});
        const data = await commonService.getStateByCountrycode(req.params.countrycode);  
        res.json({data});
  } catch (error) {
      res.json({ message: error});
  }
});

router.get('/city/:statecode', async (req, res) => {
  try {
        // const cities = await City.find({'state_code': req.params.statecode}, {_id:1, name:1});  
        // res.json({totalCount:cities.length, data: cities});
        const data = await commonService.getCityByStatecode(req.params.statecode);  
        res.json({data});
  } catch (error) {
      res.json({ message: error});
  }
});

router.get('/timezone', async (req, res) => {
    try {
          const data = await commonService.getTimezones();  
          res.json({data});
    } catch (error) {
        res.json({ message: error});
    }
  });

module.exports = router;
