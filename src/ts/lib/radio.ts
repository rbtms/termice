/**
 * Query and parse radio-browser open radio directory
 * @module Radio
 **/
//import {default as request} from 'request';
import { Entry, AnyJSON } from './interfaces';


const DEF_MODE = 'name';

const BASE_URL = 'http://all.api.radio-browser.info/json/stations/search'
const MODES = ['name', 'tag', 'country', 'language']

/**
 * @method search_radio
 * @description Search radio-browser.info for radio streams
 * @param search Non-formatted query
 * @param mode API Endpoint to query (name, tag, country, language)
 * @return Stream list promise
 **/
export function search_radio(search :string, mode :string) :Promise<Entry[]> {
  if( !MODES.includes(mode) ) {
      mode = DEF_MODE;
  }

  return new Promise( (resolve, reject) => {
    const options = {
      method : 'GET',
      url    : BASE_URL + "?" + mode + "=" + search.split(' ').join('+')
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err) {
        reject(err);
      }
      else {
        const json = JSON.parse(body);
        resolve( parse_radio(json) );
      }
    });
  });
}

function parse_radio(json :AnyJSON) :Entry[] {
  return Object.keys(json).map( (key) => ({
    name        : json[key].name,
    homepage    : json[key].homepage,
    listeners   : 'Null',
    description : 'Null',
    playing     : 'Null',
    url         : json[key].url,
    src         : 'Radio',
    bitrate     : json[key].bitrate,
    is_playlist : /\.m3u|\.pls/.test(json[key].url),
    entry       : json[key]
  }));
}

