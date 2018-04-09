"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
* @fileOverview main.js
* @author      nishinishi9999 (Alvaro Fernandez) {@link https://github.com/nishinishi9999}
* @version     0.1.0
* @description Simple terminal net stream player
* @license
* Copyright (c) 2018 Alvaro Fernandez
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see {@link https://www.gnu.org/licenses/}.
*
*
* TESTING
* @todo Go to the last index when pressing up in the first index
* @todo Fix set_title inside set_header
*
* IN PROGRESS
* @todo Catch errors
* @todo Test file
*
* ERROR
* @todo Cache loop errors
* @todo Remove layout-breaking characters
*
* TODO
* @todo Reduce startup and quit overhead
* @todo Check terminal type to decide whether to use mplayer or mplayer.exe
* @todo Check whether mplayer is installed
* @todo Volume bar
**/
const Blessed = __importStar(require("blessed"));
const minimist_1 = __importDefault(require("minimist"));
const Util = __importStar(require("./lib/util"));
const Mplayer = __importStar(require("./lib/mplayer"));
const Icecast = __importStar(require("./lib/icecast"));
const Radio = __importStar(require("./lib/radio.js"));
const Style = __importStar(require("./lib/style.js"));
const ARGV = minimist_1.default(process.argv);
/**
* Ideas
*
* Update currently playing track information
* Modularization
* Add currently playing bar
* Update frequently
*
* Add podcasts
* Add free music sources
**/
// Constants
const CONFIG = Util.read_config('./config.json');
const S = Blessed.screen({
    autoPadding: true,
    debug: true,
    dump: './log.txt',
    fullUnicode: true,
    //forceUnicode: true,
    smartCSR: true,
});
const COMP = {
    header: Blessed.listbar(Style.style.header),
    stream_table: Blessed.listtable(Style.style.stream_table),
    input: Blessed.textarea(Style.style.input),
    loading: Blessed.loading(Style.style.loading)
};
// Global variables
let LAST_SEARCH = ARGV.q || CONFIG.default_search;
let SOURCE = ARGV.s || CONFIG.default_source;
let CURRENT_INDEX = 0;
let STREAM_LIST = [];
// Global flags
let IS_PLAYING = false;
let IS_PAUSED = false;
let IS_INPUT = false;
/**
* @description Stop the player and exit
**/
function exit(line) {
    Mplayer.quit(() => {
        S.destroy();
        if (line)
            throw Error(line);
        process.exit();
    });
}
/**
* @description Stop the player
**/
function stop() {
    Mplayer.stop(() => {
        IS_PLAYING = false;
        // Update title
        set_title(SOURCE);
    });
}
/**
* @description Pause/Resume the player
**/
function pause() {
    Mplayer.pause(() => {
        IS_PAUSED = !IS_PAUSED;
        // Update pause key text
        set_header(SOURCE);
        set_title(SOURCE);
    });
}
/**
* @description Returns usage
**/
function usage() {
    return `
Usage: netstreams [ARGS]

Arguments:
  -q: Query
  -s: Source
`;
}
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
        let letter = key;
        let text = option[key];
        if (letter === pause_key)
            text = !is_paused ? 'Pause' : 'Resume';
        let style = text === tab ? sel_style : def_style;
        return acc + ` ${style} ${letter} {/} ${text}${pad}`;
    }, '');
    // Remove last space
    return line.substr(0, line.length - 1);
}
/**
* @description Set current tab in the header
* @param tab Current tab
**/
function set_header(tab) {
    const line = format_header(tab, CONFIG.header, CONFIG.pause_key, IS_PAUSED);
    COMP.header.setContent(line);
    S.render();
}
/**
* @description Format the window title line
* @param src  Current source
* @param name Entry name
* @return Title line
**/
function format_title(src, name) {
    return `Net streams - ${src}` + (name === '' ? '' : ` | ${name}`);
}
/**
* @description Set window title
* @param src  Current source
* @param name Entry name
**/
function set_title(src, name) {
    // Keep the old title if it's playing
    if (IS_PLAYING)
        return;
    S.title = name === undefined
        ? format_title(src, '')
        : format_title(src, name);
}
/**
* @description Display <rows> in stream_table
* @param Array of formatted rows
**/
function display_rows(rows) {
    COMP.stream_table.setData(rows);
    S.render();
}
/**
* @description Get query function
* @param search Search query
* @param src    Stream source
* @return Query function
**/
function query_streams(search, src) {
    switch (src) {
        case 'Icecast': {
            return () => Icecast.search_xiph(search);
        }
        case 'Shoutcast': {
            return () => Icecast.search_shoutcast(search);
        }
        case 'Radio': {
            // Parse mode
            const has_mode = search.includes(':');
            switch (has_mode) {
                // There is a match
                case true: {
                    const [mode, subsearch] = search.split(':');
                    switch (mode) {
                        // It's a valid mode
                        case 'name':
                        case 'tag':
                        case 'country':
                        case 'language': {
                            return () => Radio.search_radio(mode, subsearch);
                        }
                        // It isn't a valid mode
                        default: {
                            S.debug('Mode not recognized: ' + mode);
                            return query_streams(LAST_SEARCH, SOURCE);
                        }
                    }
                }
                // There is not a match
                default: {
                    return () => Radio.search_radio(search, 'name');
                }
            }
        }
        default: {
            S.debug('Source not recognized: ' + src);
            return query_streams(LAST_SEARCH, SOURCE);
        }
    }
}
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
/**
* @description Format icecast entries into stream_table rows
* @param rows_header Header
* @param list        Icecast entry list
* @return Formatted table rows
**/
function icecast_list(rows_header, list) {
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
function radio_list(rows_header, list) {
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
* @param src         Stream source
* @return Array of JSON Entries
**/
function format_stream_list(list, rows_header, search) {
    switch (list.length > 0) {
        case true:
            const src = list[0].src;
            switch (src) {
                case 'Icecast':
                case 'Shoutcast':
                    return icecast_list(rows_header, list);
                case 'Radio':
                    return radio_list(rows_header, list);
                default:
                    exit('Unknown source: ' + src);
                    return false;
            }
        default:
            return add_rows_padding(rows_header, [['No results for: ' + search]]);
    }
}
/**
* @description Query source and display results
* @param search Unformatted query string
* @param src    Streams source
**/
function search_streams(search, src) {
    S.debug('Searching: ', search);
    COMP.loading.load('Searching: ' + search);
    // Update global variables
    LAST_SEARCH = search;
    CURRENT_INDEX = 0;
    query_streams(search, src)().then((list) => {
        // Update current stream list for events
        STREAM_LIST = list;
        // Process the list and display it
        const rows = format_stream_list(list, CONFIG.table_headers[src], search);
        //// Show an error message on false
        if (rows !== false) {
            display_rows(rows);
            COMP.loading.stop();
            set_header(src);
            set_title(src);
        }
    })
        .catch((err) => { S.debug('Error: ' + err); });
}
/**
* @description Refresh table with last query
**/
function refresh_table() {
    search_streams(LAST_SEARCH, SOURCE);
}
/**
* @description Play a url with mplayer
* @param entry Table entry
**/
function play_url(entry) {
    Mplayer.play(entry.url, entry.is_playlist, () => {
        IS_PLAYING = false;
        IS_PAUSED = false;
        set_header(entry.src);
        set_title(entry.src, entry.name);
        IS_PLAYING = true;
    });
}
/**
* @description Toggle the input textarea
**/
function toggle_input() {
    S.debug('toggle');
    // Toggle input
    COMP.input.toggle();
    S.render();
    // Enable input
    if (!IS_INPUT)
        COMP.input.input();
    // Change tab
    const tab = IS_INPUT ? SOURCE : 'Search';
    set_header(tab);
    set_title(tab);
    IS_INPUT = !IS_INPUT;
}
function input_handler(str) {
    if (str === ':q') {
        exit();
    }
    else {
        COMP.input.clearValue();
        search_streams(str, SOURCE);
        toggle_input();
    }
}
/**
* @description Set events
**/
function set_events() {
    // Screen events
    S.key([CONFIG.keys.screen.quit], (_) => exit()); // Discard arguments
    S.key([CONFIG.keys.screen.pause], (_) => pause());
    S.key([CONFIG.keys.screen.stop], (_) => stop());
    S.key([CONFIG.keys.screen.input], toggle_input);
    S.key([CONFIG.keys.screen.vol_up], () => Mplayer.volume('+1'));
    S.key([CONFIG.keys.screen.vol_down], () => Mplayer.volume('-1'));
    // Icecast tab
    S.key(CONFIG.keys.screen.icecast, () => {
        SOURCE = 'Icecast';
        refresh_table();
    });
    // Shoutcast tab
    S.key(CONFIG.keys.screen.shoutcast, () => {
        SOURCE = 'Shoutcast';
        refresh_table();
    });
    // Radio tab
    S.key(CONFIG.keys.screen.radio, () => {
        SOURCE = 'Radio';
        refresh_table();
    });
    // Refresh table
    S.key(CONFIG.keys.screen.refresh, () => {
        refresh_table();
    });
    // Stream table events
    COMP.stream_table.on('select', (_, i) => {
        const entry = STREAM_LIST[i - 1];
        play_url(entry);
        S.debug('Playing: ', entry.url);
    });
    // Arrow keys
    COMP.stream_table.key(CONFIG.keys.stream_table.up, () => {
        if (CURRENT_INDEX === 0) {
            // Select last index
            // Note: Up key event is triggered after the end of this function,
            //       because of that the index is STREAM_LIST.length and not
            //       STREAM_LIST.length-1
            CURRENT_INDEX = STREAM_LIST.length - 1;
            COMP.stream_table.select(CURRENT_INDEX + 1);
            S.render();
        }
        else {
            CURRENT_INDEX--;
        }
        //S.debug( CURRENT_INDEX.toString() );
    });
    COMP.stream_table.key(CONFIG.keys.stream_table.down, () => {
        if (STREAM_LIST.length - 1 === CURRENT_INDEX) {
            // Select first index
            CURRENT_INDEX = 0;
            COMP.stream_table.select(CURRENT_INDEX);
            S.render();
        }
        else {
            CURRENT_INDEX++;
        }
        //S.debug( CURRENT_INDEX.toString() );
    });
    // Input form events
    COMP.input.key('enter', () => {
        const line = COMP.input.getText().trim();
        input_handler(line);
    });
}
/**
* @description Main
**/
function main() {
    if (ARGV.h) {
        console.log(usage());
        process.exit();
    }
    // Initialize
    set_events();
    S.append(COMP.header);
    S.append(COMP.stream_table);
    S.append(COMP.input);
    S.append(COMP.loading);
    COMP.stream_table.focus();
    S.render();
    search_streams(LAST_SEARCH, SOURCE);
}
main();
