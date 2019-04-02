"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEF_MODE = 'name';
const MODE_URL = {
    name: 'http://www.radio-browser.info/webservice/json/stations/byname/',
    tag: 'http://www.radio-browser.info/webservice/json/stations/bytag/',
    country: 'http://www.radio-browser.info/webservice/json/stations/bycountry/',
    language: 'http://www.radio-browser.info/webservice/json/stations/bylanguage/'
};
/**
* @method search_radio
* @description Search radio-browser.info for radio streams
* @param search Non-formatted query
* @param mode API Endpoint to query (name, tag, country, language)
* @return Stream list promise
**/
function search_radio(search, mode) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            url: (MODE_URL[mode] || MODE_URL[DEF_MODE]) + search.split(' ').join('+')
        };
        require('request')(options, (err, _, body) => {
            if (err)
                reject(err);
            const json = JSON.parse(body);
            resolve(parse_radio(json));
        });
    });
}
exports.search_radio = search_radio;
function parse_radio(json) {
    return Object.keys(json).map((key) => ({
        name: json[key].name,
        bitrate: json[key].bitrate,
        homepage: json[key].homepage,
        url: json[key].url,
        src: 'Radio',
        is_playlist: /\.m3u|\.pls/.test(json[key].url)
    }));
}
