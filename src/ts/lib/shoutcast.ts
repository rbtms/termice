/**
 * Query and parse Shoutcast directory
 * @module Shoutcast
 **/
import { Entry, AnyJSON } from './interfaces';
import { error_entry } from './util';

/**
 * @method search_shoutcast
 * @description Search the shoutcast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export function search_shoutcast(search :string) :Promise<Entry[]> {
  return new Promise( (resolve) => {
    const options = {
      method   : 'POST',
      url      : 'https://directory.shoutcast.com/Search/UpdateSearch',
      form : {
        query: search.split(' ').join('+')
      }
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err) {
        resolve( [ error_entry(err, 'Shoutcast') ] );
      }
      else {
        try {
          const json = JSON.parse(body);
          resolve( parse_shoutcast(json) );
        }
        catch(err) {
          resolve([ error_entry(err, 'Shoutcast') ]);
        }
      }
    });
  });
}

function parse_shoutcast(json :AnyJSON) :Entry[] {
  return Object.keys(json).map( key => ({
    name        : json[key].Name
      || 'Null',
    homepage    : '',
    listeners   : json[key].Listeners !== undefined ? json[key].Listeners.toString()
      : 'Null',
    description : '',
    playing     : json[key].CurrentTrack
      || '',
    url         : `http://yp.shoutcast.com/sbin/tunein-station.m3u?id=${json[key].ID}`,
    src         : 'Shoutcast',
    bitrate     : json[key].Bitrate ? json[key].Bitrate.toString()
      : '',
    is_playlist : true,
    entry       : json[key]
  }));
}

