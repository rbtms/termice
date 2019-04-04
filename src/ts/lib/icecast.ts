/**
 * Query and parse Icecast and Shoutcast directories
 * @module Icecast
 **/
import { Entry, AnyJSON } from './interfaces';
import { error_entry } from './util';

/**
 * @method search_xiph
 * @description Search the xiph icecast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export function search_xiph(search :string) :Promise<Entry[]> {
  return new Promise( (resolve) => {
    const options = {
      method : 'GET',
      url    : 'http://dir.xiph.org/search?search=' + search.split(' ').join('+')
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err)
        resolve( [error_entry(err)] );
      else
        resolve( parse_xiph(body) );
    });
  });
}

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
        resolve( [ error_entry(err) ] );
      }
      else {
        try {
          const json = JSON.parse(body);
          resolve( parse_shoutcast(json) );
        }
        catch(err) {
          resolve([ error_entry(err) ]);
        }
      }
    });
  });
}

function parse_xiph(body :string) :Entry[] {
  // Import here in order to improve startup performance (~400ms)
  const JSDOM = require('jsdom').JSDOM;

  const host = 'http://dir.xiph.org';
  const playing_pos = 25;
  let document;

  try {
    document = new JSDOM(body).window.document;
  }
  catch(err) {
    return [error_entry('Couldn\'t parse XIPH')];
  }

  const rows = document
    .querySelector('body > #thepage > #content > .servers-list :nth-child(1)');

  if(rows === null)
    return [];
  else
    return Array.from(rows.children).map( (entry :any) => {
      const sel_name_hp     = entry.querySelector('.description > .stream-name > .name > a');
      const sel_listeners   = entry.querySelector('.description > .stream-name > .listeners');
      const sel_description = entry.querySelector('.description > .stream-description');
      const sel_playing     = entry.querySelector('.description > .stream-onair');
      const sel_url         = entry.querySelector('.tune-in > .format ~ p :nth-child(1)');
      const sel_bitrate     = entry.querySelector('.tune-in > p ~ :last-child');

      let bitrate;

      if(sel_bitrate && sel_bitrate.title) {
        const match = sel_bitrate.title.match(/\d+/);

        if(sel_bitrate.title.includes('kbps') && match)
          bitrate = match[0];
        else
          bitrate = '';
      }
      else {
        bitrate = 'Null';
      }

      // TODO: Write this more robustly
      return {
        name        : sel_name_hp     ? sel_name_hp.innerHTML
          : 'Null',
        homepage    : sel_name_hp     ? sel_name_hp.href
          : 'Null',
        listeners   : sel_listeners   ? sel_listeners.innerHTML.split('&nbsp')[0].substr(1)
          : 'Null',
        description : sel_description ? sel_description.innerHTML
          : '',
        playing     : sel_playing     ? sel_playing.innerHTML.substr(playing_pos)
          : '',
        url         : sel_url         ? host + sel_url.href
          : 'Null',
        bitrate,
        src         : 'Icecast',
        is_playlist : true,
        entry       : entry.innerHTML
      };
    });
}

search_shoutcast('anime').then();

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

