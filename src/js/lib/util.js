"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Util
 * @module Util
 **/
const JsonFile = __importStar(require("jsonfile"));
exports.CONFIG_PATH = './src/js/config.json';
/**
 * @description Read configuration file
 **/
function read_config(path) {
    try {
        const config = JsonFile.readFileSync(path);
        return Object.freeze(config);
    }
    catch (err) {
        throw Error(`Couldn't load ${path}: ${err})`);
    }
}
exports.read_config = read_config;
/**
 * @description Format the window title line
 * @param src  Current source
 * @param name Entry name
 * @return Title line
 **/
function format_title(s, name) {
    return `Net streams - ${s.flags.source}` + (name === '' ? '' : ` | ${name}`);
}
exports.format_title = format_title;
/**
 * @description Format header line
 * @param tab       Current tab
 * @param option    Option key-value pairs
 * @param pause_key Header key text of the pause key
 * @param is_paused Whether the player is currently paused or not
 * @return Formatted header line
 **/
function format_header(tab, option, pause_key, is_paused) {
    const def_style = '{white-bg}{black-fg}'; // Default style
    const sel_style = '{green-bg}{black-fg}'; // Selected style
    const pad = ' ';
    const line = Object.keys(option).reduce((acc, key) => {
        const letter = key;
        const text = letter == pause_key
            ? !is_paused
                ? 'Pause'
                : 'Resume'
            : option[key];
        const style = text === tab ? sel_style : def_style;
        return acc + ` ${style} ${letter} {/} ${text}${pad}`;
    }, '');
    // Remove last space
    // TODO: Replace for trim
    return line.substr(0, line.length - 1);
}
exports.format_header = format_header;
/**
 * @description Add left padding to stream_table cells
 * @param rows_header Header
 * @param rows        Table rows
 * @return Padded table rows
 **/
function add_rows_padding(rows_header, rows) {
    const pad = '  ';
    return [rows_header].concat(rows).map((arr) => arr.map((cell) => pad + cell));
}
exports.add_rows_padding = add_rows_padding;
/**
 * @description Format icecast entries into stream_table rows
 * @param rows_header Header
 * @param list        Icecast entry list
 * @return Formatted table rows
 **/
function format_icecast_list(rows_header, list) {
    const char_limit = {
        name: 30,
        playing: 50,
        description: 50,
        listeners: 20
    };
    return add_rows_padding(rows_header, list.map((entry) => {
        const playing = entry.playing || '';
        const listeners = entry.listeners || 'Null';
        //const description = entry.description || 'Null';
        return [
            entry.name.substr(0, char_limit.name),
            playing.substr(0, char_limit.playing),
            //description.substr(0, char_limit.description),
            listeners.substr(0, char_limit.listeners)
        ];
    }));
}
/**
 * @description Format radio entries into stream_table rows
 * @param rows_header Header
 * @param list        Radio entry list
 * @return Formatted table rows
 **/
function format_radio_list(rows_header, list) {
    const bitrate_pad = '   ';
    const char_limit = {
        name: 50
    };
    return add_rows_padding(rows_header, list.map((entry) => {
        const bitrate = entry.bitrate || 'Null';
        const pad = bitrate_pad.substr(bitrate.length);
        return [
            entry.name.substr(0, char_limit.name),
            `${pad}${bitrate} kbps`
        ];
    }));
}
/**
 * @description Get streams from <src>
 * @param list        Entry list
 * @param rows_header Rows header
 * @param search      Query search
 * @return Array of JSON Entries
 **/
function format_stream_list(s, list, rows_header, search) {
    switch (list.length > 0) {
        case true:
            const src = list[0].src;
            switch (src) {
                case 'Icecast':
                case 'Shoutcast':
                    return format_icecast_list(rows_header, list);
                case 'Radio':
                    return format_radio_list(rows_header, list);
                default:
                    //exit(s, 'Unknown source: ' + src);
                    //return false;
                    throw 'Unknown source: ' + src + ' ' + s;
            }
        default:
            return add_rows_padding(rows_header, [['No results for: ' + search]]);
    }
}
exports.format_stream_list = format_stream_list;
