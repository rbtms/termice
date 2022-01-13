/**
 * Query and parse Icecast directory
 * @module Icecast
 **/
import { Entry } from './interfaces';
import { error_entry } from './util';

/**
 * @method search_xiph
 * @description Search the xiph icecast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export function search_xiph(search :string) :Promise<Entry[]> {
  return new Promise( resolve => {
    const options = {
      method : 'GET',
      url    : 'http://dir.xiph.org/search?q=' + search.split(' ').join('+')
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err)
        resolve( [error_entry(err, 'Icecast')] );
      else
        resolve( parse_xiph(body) );
    });
  });
}

function parse_xiph(body :string) :Entry[] {
  // Import here in order to improve startup performance (~400ms)
  const JSDOM = require('jsdom').JSDOM;

  const host = 'http://dir.xiph.org';
  //const playing_pos = 25;
  let document;

  try {
    document = new JSDOM(body).window.document;
  }
  catch(err) {
    return [error_entry('Couldn\'t parse XIPH', 'Icecast')];
  }

  const rows = document.querySelectorAll('.card');

  if(rows === null)
    return [];
  else
    return Array.from(rows).map( (entry :any) => {
      const sel_name_hp     = entry.querySelector('.card-title');
      const sel_playing     = entry.querySelector('.card-subtitle'); //.innerHTML.substr(8);
      const sel_description = entry.querySelector('.card-text');
      const sel_url         = entry.querySelector('.card-footer > div :last-child'); //.href;
      const sel_listeners   = entry.querySelector('.card-footer'); //.textContent.trim().split(" ")[0]);

      // TODO: Write this more robustly
      return {
        name        : sel_name_hp     ? sel_name_hp.innerHTML
          : 'Null',
        homepage    : 'Null',
        listeners   : sel_listeners   ? sel_listeners.textContent.trim().split(' ')[0]
          : 'Null',
        description : sel_description ? sel_description.innerHTML.trim()
          : '',
        playing     : sel_playing     ? sel_playing.innerHTML.substr(8)//.substr(playing_pos)
          : '',
        url         : sel_url         ? host + sel_url.href
          : 'Null',
        bitrate     : 'Null',
        src         : 'Icecast',
        is_playlist : true,
        entry       : entry.innerHTML
      };
    }).sort((entry1, entry2) => entry2.listeners - entry1.listeners);
}

