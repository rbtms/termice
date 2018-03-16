/**
* Query and parse radio-browser open radio directory
* @module Radio
**/
'use strict';

const request = require('request');


const mode_url = {
    name     : 'http://www.radio-browser.info/webservice/json/stations/byname/',
    tag      : 'http://www.radio-browser.info/webservice/json/stations/bytag/',
    country  : 'http://www.radio-browser.info/webservice/json/stations/bycountry/',
    language : 'http://www.radio-browser.info/webservice/json/stations/bylanguage/'
};

/**
* search_radio :: String -> Promise
* @method search_radio
* @description Search radio-browser.info for radio streams
* @param {String} search Non-formatted query
* @param {String} mode API Endpoint to query (name, tag, country, language)
* @return {Promise} Stream list promise
**/
function search_radio(search, mode) {
    if(mode_url[mode] === undefined) return;
    
    search = search.split(' ').join('+');
    
    return new Promise( (resolve, reject) => {
        
        const options = {
            method : 'GET',
            url    : mode_url[mode]+search
        };
        
        request(options, (err, res, body) => {
            if(err) reject(err);
            
            const json = JSON.parse(body);
            
            resolve( parse_radio(json) );
        });
    
    });
}

function parse_radio(json) {
    var stream_list = [];
    
    //console.log(json);
    
    for(var key in json) {
        stream_list.push({
            name        : json[key].name,
            bitrate     : json[key].bitrate,
            homepage    : json[key].homepage,
            url         : json[key].url,
            src         : 'Radio',
            is_playlist : /\.m3u|\.pls/.test(json[key].url)
        });
    }
    
    return stream_list;
}


module.exports = {
    search: search_radio
};