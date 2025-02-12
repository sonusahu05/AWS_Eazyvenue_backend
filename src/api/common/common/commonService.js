const jwt = require('jsonwebtoken');
const config = require('config');

const CommonRepository = require('./commonRepository');
const CustomErrorService = require('../../../utils/customErrorService');

class CommonService {
  constructor() {
    this.repository = new CommonRepository();
  }

  addMany(data, collection) {
    //console.log(collection);
    return this.repository.addMany(data, collection);
  }  

  getCityByname(cityname) {
    return this.repository.getCityByname(cityname);
  }

  getCityByStatecode(statecode) {
    return this.repository.findByStatecode(statecode)
      .then(data => {
        return {    
          totalCount: data.length,      
          items: data.map(item => this.mapCityData(item)),          
        };
      });   
  }

  getStateByCountrycode(countrycode) {
    return this.repository.findByCountrycode(countrycode)
      .then(data => {
        return {    
          totalCount: data.length,      
          items: data.map(item => this.mapStateData(item)),          
        };
      });   
  }

  getCountry() {
    return this.repository.getCountryList()
      .then(data => {
        return {    
          totalCount: data.length,      
          items: data.map(item => this.mapCountryData(item)),          
        };
      });  
  }

  getCurrency() {
    return this.repository.getCurrencyList()
      .then(data => {        
        return {    
          totalCount: data.length,      
          items: data.map(item => this.mapCurrencyData(item)),          
        };
      });  
  }

  getTimezones() {
    return this.repository.getTimezoneList()
      .then(data => {
        return {    
          totalCount: data.length,      
          items: data.map(item => this.mapTimeZoneData(item)),          
        };
      });  
  }

  mapTimeZoneData(timezone) {
    return timezone ? {
      name: timezone,
      code: timezone
    } : {};
  }

  mapCityData(city) {
    return city ? {
      name: city.name,
      code: city.name
    } : {};
  }

  mapStateData(state) {
    return state ? {
      name: state.name,
      code: state.id
    } : {};
  }

  mapCountryData(country) {
    return country ? {
      name: country.name,
      code: country.iso2,
    } : {};
  } 

  mapCurrencyData(currency) {
    return currency ? {
      name: currency._id.currency,
      currency_symbol: currency._id.currency_symbol,

    } : {};
  } 
}

module.exports = CommonService;
