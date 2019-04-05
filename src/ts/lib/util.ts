/**
 * Util
 * @module Util
 **/
//import * as JsonFile from 'jsonfile';
import {
  State,
  Entry,
  StringJSON,
  AnyJSON } from './interfaces';

//export const CONFIG_PATH = '/etc/netstreams/config.json';
//export const STYLES_PATH = '/etc/netstreams/styles.json';
export const CONFIG_PATH = './src/conf/config.json';
export const STYLES_PATH = './src/conf/styles.json';

/**
 * @description Read configuration file
 **/
export function read_json(path :string) :AnyJSON {
  try {
    const json = require('jsonfile').readFileSync(path);
    return json;
  }
  catch(err) {
    throw Error(`Couldn't load ${path}: ${err})`);
  }
}

export function read_config() :AnyJSON {
  return read_json(CONFIG_PATH);
}

export function read_styles() :AnyJSON {
  return read_json(STYLES_PATH);
}

export function format_init_header(option :StringJSON) :string {
  const def_style = '{white-bg}{black-fg}';
  const pad = ' ';

  const line = Object.keys(option).reduce( (acc, key) =>
    acc + ` ${def_style} ${key} {/} ${option[key]}${pad}`
    , '');

  // Remove last space
  return line.substr(0, line.length-1);
}

/**
 * @description Format the window title line
 * @param src  Current source
 * @param name Entry name
 * @return Title line
 **/
export function format_title(s :State, name :string) :string {
  return `Net streams - ${s.flags.source}` + (name === '' ? '' : ` | ${name}`);
}

/**
 * @description Format header line
 * @param tab       Current tab
 * @param option    Option key-value pairs
 * @param pause_key Header key text of the pause key
 * @param is_paused Whether the player is currently paused or not
 * @return Formatted header line
 **/
export function format_header(
  tab       :string,
  option    :StringJSON,
  pause_key :string,
  is_paused :boolean) :string {

  const def_style = '{white-bg}{black-fg}'; // Default style
  const sel_style = '{green-bg}{black-fg}'; // Selected style
  const pad = ' ';

  const line = Object.keys(option).reduce( (acc, key) => {
    const letter = key;
    const text   = letter === pause_key
      ? !is_paused
        ? 'Pause'
        : 'Resume'
      : option[key];

    const style = text === tab ? sel_style : def_style;

    return acc + ` ${style} ${letter} {/} ${text}${pad}`;
  }, '');


  // Remove last space
  // TODO: Replace for trim
  return line.substr(0, line.length-1);
}

/**
 * @description Add left padding to stream_table cells
 * @param rows_header Header
 * @param rows        Table rows
 * @return Padded table rows
 **/
export function add_rows_padding(rows_header :string[], rows :string[][]) :string[][] {
  const pad = '  ';

  return [rows_header].concat(rows).map( (arr) =>
    arr.map( (cell) => pad + cell )
  );
}

export function error_entry(error :string) :Entry {
  return {
    name        : error,
    homepage    : '',
    listeners   : '',
    description : '',
    playing     : '',
    url         : '',
    bitrate     : '',
    src         : '',
    is_playlist : false,
    entry       : ''
  };
}

function format_bitrate(bitrate :string) :string {
  const bitrate_pad = '   ';
  const pad     = bitrate_pad.substr(bitrate.length);
  return !bitrate || bitrate === '0' ? '' : `${pad}${bitrate} kbps`;
}

/**
 * @description Format icecast entries into stream_table rows
 * @param rows_header Header
 * @param list        Icecast entry list
 * @return Formatted table rows
 **/
function format_icecast_list(rows_header :string[], list :Entry[]) :string[][] {
  const char_limit = {
    name: 30,
    playing: 50,
    description: 50,
    listeners: 20,
    bitrate: 20
  };

  return add_rows_padding(rows_header, list.map( entry => [
    entry.name.substr       (0, char_limit.name),
    entry.playing.substr    (0, char_limit.playing),
    //description.substr(0, char_limit.description),
    entry.listeners.substr  (0, char_limit.listeners),
    format_bitrate(entry.bitrate).substr(0, char_limit.bitrate)
  ]));
}

function format_shoutcast_list(rows_header :string[], list :Entry[]) :string[][] {
  const char_limit = {
    name: 30,
    playing: 50,
    description: 50,
    listeners: 20,
    bitrate: 20
  };

  return add_rows_padding(rows_header, list.map( entry => [
    entry.name.substr       (0, char_limit.name),
    entry.playing.substr    (0, char_limit.playing),
    //description.substr(0, char_limit.description),
    entry.listeners.substr  (0, char_limit.listeners),
    format_bitrate(entry.bitrate).substr(0, char_limit.bitrate)
  ]));
}

/**
 * @description Format radio entries into stream_table rows
 * @param rows_header Header
 * @param list        Radio entry list
 * @return Formatted table rows
 **/
function format_radio_list(rows_header :string[], list :Entry[]) :string[][] {
  const char_limit  = {
    name: 50,
    bitrate: 20
  };

  return add_rows_padding(rows_header, list.map( entry => [
    entry.name.substr(0, char_limit.name),
    format_bitrate(entry.bitrate).substr(0, char_limit.bitrate)
  ]));
}

/**
 * @description Get streams from <src>
 * @param list        Entry list
 * @param rows_header Rows header
 * @param search      Query search
 * @return Array of JSON Entries
 **/
export function format_stream_list(
  s           :State,
  list        :Entry[],
  rows_header :string[],
  search      :string) : (string[][] | false) {

  switch(list.length > 0) {
    case true:
      const src = list[0].src;

      switch(src) {
        case 'Icecast':
          return format_icecast_list(rows_header, list);
        case 'Shoutcast':
          return format_shoutcast_list(rows_header, list);
        case 'Radio':
          return format_radio_list(rows_header, list);
        default:
          //exit(s, 'Unknown source: ' + src);
          //return false;
          throw Error(`Unknown source: ${src} ${s}`);
      }
    default:
      return add_rows_padding(rows_header, [['No results for: ' + search]]);
  }
}


