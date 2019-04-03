/**
 * Query and parse Icecast and Shoutcast directories
 * @module Icecast
 **/
import { IcecastEntry, AnyJSON } from './interfaces';
import { JSDOM } from 'jsdom';

/**
 * @method search_xiph
 * @description Search the xiph icecast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export function search_xiph(search :string) :Promise<IcecastEntry[]> {
  return new Promise( (resolve, reject) => {

    const options = {
      method : 'GET',
      url    : 'http://dir.xiph.org/search?search=' + search.split(' ').join('+')
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err) reject(err);

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
export function search_shoutcast(search :string) :Promise<IcecastEntry[]> {
  return new Promise( (resolve, reject) => {
    const options = {
      method   : 'POST',
      url      : 'https://directory.shoutcast.com/Search/UpdateSearch',
      form : {
        query: search.split(' ').join('+')
      }
    };

    require('request')(options, (err :string, _ :any, body :string) => {
      if(err)
        reject(err);

      const json = JSON.parse(body);
      resolve( parse_shoutcast(json) );
    });
  });
}

function parse_xiph(body :string) :IcecastEntry[] {
  const host = 'http://dir.xiph.org';
  const playing_pos = 25;

  const document = new JSDOM(body).window.document;
  const rows = document.querySelector('body > #thepage > #content > .servers-list :nth-child(1)');

  if(rows === null)
    return [];
  else
    return Array.from(rows.children).map( (entry :any) => {
      const sel_name_hp     = entry.querySelector('.description > .stream-name > .name > a');
      const sel_listeners   = entry.querySelector('.description > .stream-name > .listeners');
      const sel_description = entry.querySelector('.description > .stream-description');
      const sel_playing     = entry.querySelector('.description > .stream-onair');
      const sel_url         = entry.querySelector('.tune-in > .format ~ p :nth-child(1)');

      return {
        name        : sel_name_hp ? sel_name_hp.innerHTML : 'Null',
        homepage    : sel_name_hp ? sel_name_hp.href      : 'Null',
        listeners   : sel_listeners   ? sel_listeners.innerHTML.split('&nbsp')[0].substr(1) : 'Null',
        description : sel_description ? sel_description.innerHTML : '',
        playing     : sel_playing     ? sel_playing.innerHTML.substr(playing_pos) : '',
        url         : sel_url         ? host + sel_url.href : 'Null',
        src         : 'Icecast',
        is_playlist : true
      };
    });
}

function parse_shoutcast(json :AnyJSON) :IcecastEntry[] {
  return Object.keys(json).map( key => ({
    name        : json[key].Name,
    homepage    : '',
    listeners   : json[key].Listeners.toString(),
    description : '',
    playing     : json[key].CurrentTrack,
    url         : `http://yp.shoutcast.com/sbin/tunein-station.m3u?id=${json[key].ID}`,
    src         : 'Shoutcast',
    is_playlist : true
  }));
}

