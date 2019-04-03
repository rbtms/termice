"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileOverview main.js
 * @author       Alvaro Fernandez {@link https://github.com/nishinishi9999}
 * @version      0.1.0
 * @description  Simple terminal net stream player
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
 * IN PROGRESS
 * @todo Catch errors
 * @todo Test file
 *
 * ERROR
 * @todo Cache loop errors
 * @todo Remove layout-breaking characters
 *
 * TODO
 * @todo Add mplayer to deb dependencies
 * @todo Volume bar
 * @todo Add option to add non-selectable descriptions
  **/
const minimist_1 = __importDefault(require("minimist"));
const Util = __importStar(require("./lib/util"));
const Icecast = __importStar(require("./lib/icecast"));
const Radio = __importStar(require("./lib/radio"));
const Style = __importStar(require("./lib/style"));
const mplayer_1 = __importDefault(require("./lib/mplayer"));
/**
 * TODO
 *
 * Update currently playing track information
 * Add currently playing bar
 * Update frequently
 *
 * Add podcasts
 * Add free music sources
 **/
/**
 * TODO: Remove this function in favor of quit
 * @description Destroy the interface and force exit the program
 * @param s State
 * @param smth Anything to print
 **/
async function force_exit(s, smth) {
    await mplayer_1.default.quit();
    s.scr.destroy();
    console.log(smth);
    throw 'Force exit';
    process.exit();
}
/**
 * @description Print usage and exit
 **/
function print_usage_and_exit() {
    console.log(`
Usage: netstreams [ARGS]

Options:
  -h: Show this help
  -q: Query
  -s: Source [Icecast | Shoutcast | Radio]
`);
    process.exit();
}
/**
 * @description Stop the player and exit
 * @param s State
 * @param line Exit line
 **/
async function exit(s, line = '') {
    await mplayer_1.default.quit();
    // Exit interface
    s.scr.destroy();
    // Print exit line if there is one
    if (line)
        throw Error(line);
    process.exit();
}
/**
 * @description Stop the player
 * @param s State
 **/
async function stop(s) {
    await mplayer_1.default.stop();
    const s2 = set_flags(s, { is_playing: !s.flags.is_playing });
    // Update title
    set_title(s2);
    return s2;
}
/**
 * @description Set state flags
 * @param s State
 * @param flags Flags to set
 **/
function set_flags(s, flags) {
    const _flags = Object.assign(Object.assign({}, s.flags), flags);
    return {
        scr: s.scr,
        comp: s.comp,
        config: s.config,
        stream_list: s.stream_list.slice(),
        flags: _flags
    };
}
/**
 * @description Set state stream list
 * @param s State
 * @param list Stream list
 **/
function set_stream_list(s, list) {
    return {
        scr: s.scr,
        comp: s.comp,
        config: s.config,
        stream_list: list.slice(),
        flags: s.flags
    };
}
/**
 * @description Pause/Resume the player
 * @param s State
 **/
async function pause(s) {
    await mplayer_1.default.pause();
    // Update pause key text
    // Renders screen
    set_header_title(s);
    return set_flags(s, { is_paused: !s.flags.is_paused });
}
/**
 * @description Play a url with mplayer
 * @param s State
 * @param entry Stream entry
 **/
async function play_url(s, entry) {
    try {
        await mplayer_1.default.play(entry.url, entry.is_playlist);
        const s2 = set_flags(s, {
            is_playing: false,
            is_paused: false
        });
        // Renders screen
        set_header_title(s2, entry.name);
        return set_flags(s2, { is_playing: true });
    }
    catch (err) {
        force_exit(s, err);
        // TODO: Mock return
        return s;
    }
}
/**
 * @description Set current tab in the header
 * @param s State
 **/
function set_header(s) {
    const line = Util.format_header(s.flags.last_tab, s.config.header, s.config.pause_key, s.flags.is_paused);
    s.comp.header.setContent(line);
}
/**
 * @description Set window title
 * @param s State
 * @param stream_name Name of the stream
 **/
function set_title(s, stream_name = '') {
    // Keep the old title if it's playing
    if (!s.flags.is_playing)
        s.scr.title = Util.format_title(s, stream_name);
}
/**
 * @description Set header tab and window title
 * @param s State
 * @param stream_name Name of the stream
 */
function set_header_title(s, stream_name = '') {
    set_header(s);
    set_title(s, stream_name);
    s.scr.render();
}
/**
 * @description Display <rows> in stream_table
 * @param s State
 * @param rows Array of formatted rows
 **/
function set_rows(s, rows) {
    s.comp.stream_table.setData(rows);
}
/**
 * @description Get query function
 * @param s State
 * @param search Search query
 **/
function query_streams(s, search) {
    switch (s.flags.source) {
        case 'Icecast': {
            return Icecast.search_xiph(search);
        }
        case 'Shoutcast': {
            return Icecast.search_shoutcast(search);
        }
        case 'Radio': {
            // Parse mode
            const has_mode = search.includes(':');
            // There is a match
            if (has_mode) {
                const [mode, subsearch] = search.split(':');
                switch (mode) {
                    // It's a valid mode
                    case 'name':
                    case 'tag':
                    case 'country':
                    case 'language': {
                        return Radio.search_radio(mode, subsearch);
                    }
                    // It isn't a valid mode
                    default: {
                        return query_streams(s, s.flags.last_search);
                    }
                }
            }
            // There is not a match
            else {
                return Radio.search_radio(search, 'name');
            }
        }
        default: {
            force_exit(s, 'Not a valid source: ' + s.flags.source);
            return query_streams(s, s.flags.last_search);
        }
    }
}
/**
 * @description Query source and display results
 * @param s State
 * @param search Unformatted query string
 **/
async function search_streams(s, search) {
    s.comp.loading.load('Searching: ' + search);
    // Update flags
    const s2 = set_flags(s, {
        last_search: search,
        last_tab: s.flags.source,
        current_index: 0
    });
    const list = await query_streams(s2, search);
    // Update current stream list for events
    const s3 = set_stream_list(s2, list);
    // Process the list and display it
    const rows = Util.format_stream_list(s3, list, s3.config.table_headers[s3.flags.source], search);
    //// Show an error message on false
    if (rows !== false) {
        set_rows(s3, rows);
        s3.comp.loading.stop();
        // Renders screen
        set_header_title(s3);
    }
    return s3;
}
/**
 * @description Refresh table with last query
 * @param s State
 **/
async function refresh_table(s) {
    return await search_streams(s, s.flags.last_search);
}
function show_input(s) {
    const s2 = set_flags(s, { last_tab: 'Search' });
    s2.comp.input.show();
    //s2.comp.input.input();
    s2.comp.input.focus();
    set_header_title(s2);
    return s2;
}
function hide_input(s) {
    const s2 = set_flags(s, { last_tab: s.flags.source });
    s2.comp.input.hide();
    s2.comp.stream_table.focus();
    set_header_title(s2);
    return s2;
}
/**
 * @description Handle raw input lines
 * @param s State
 * @param line Input line
 **/
async function input_handler(s, line) {
    // Command
    if (line === ':q') {
        await exit(s);
        return s;
    }
    // Query
    else {
        s.comp.input.clearValue();
        const s2 = hide_input(s);
        return await search_streams(s2, line);
    }
}
/**
 * @description Set blessed events
 * @param s State
 **/
function set_events(s) {
    // Delete previous select event as there doesnt
    // seem to be any elegant way to do it
    s.scr.unkey([s.config.keys.screen.quit]);
    s.scr.unkey([s.config.keys.screen.pause]);
    s.scr.unkey([s.config.keys.screen.stop]);
    s.scr.unkey([s.config.keys.screen.vol_up]);
    s.scr.unkey([s.config.keys.screen.vol_down]);
    s.scr.unkey([s.config.keys.screen.input]);
    s.scr.unkey(s.config.keys.screen.icecast);
    s.scr.unkey(s.config.keys.screen.shoutcast);
    s.scr.unkey(s.config.keys.screen.radio);
    s.scr.unkey(s.config.keys.screen.refresh);
    s.comp.stream_table.unkey([s.config.keys.screen.input]);
    s.comp.input.unkey([s.config.keys.screen.input]);
    s.comp.input.unkey('enter');
    delete s.comp.stream_table._events.select;
    // -----------------------------------------------------
    // Screen events
    s.scr.onceKey([s.config.keys.screen.quit], () => exit(s)); // Discard arguments
    s.scr.onceKey([s.config.keys.screen.pause], async () => {
        const s2 = await pause(s);
        set_events(s2);
    });
    s.scr.onceKey([s.config.keys.screen.stop], async () => {
        const s2 = await stop(s);
        set_events(s2);
    });
    s.scr.onceKey([s.config.keys.screen.vol_up], () => mplayer_1.default.volume('+1'));
    s.scr.onceKey([s.config.keys.screen.vol_down], () => mplayer_1.default.volume('-1'));
    // Icecast tab
    s.scr.onceKey(s.config.keys.screen.icecast, async () => {
        const s2 = await refresh_table(set_flags(s, { source: 'Icecast' }));
        set_events(s2);
    });
    // Shoutcast tab
    s.scr.onceKey(s.config.keys.screen.shoutcast, async () => {
        const s2 = await refresh_table(set_flags(s, { source: 'Shoutcast' }));
        set_events(s2);
    });
    // Radio tab
    s.scr.onceKey(s.config.keys.screen.radio, async () => {
        const s2 = await refresh_table(set_flags(s, { source: 'Radio' }));
        set_events(s2);
    });
    // Refresh table
    s.scr.onceKey(s.config.keys.screen.refresh, async () => {
        const s2 = await refresh_table(s);
        set_events(s2);
    });
    // Stream table events
    s.comp.stream_table.on('select', async (_, i) => {
        const entry = s.stream_list[i - 1];
        const s2 = await play_url(s, entry);
        set_events(s2);
    });
    s.comp.stream_table.onceKey([s.config.keys.screen.input], async () => {
        const s2 = show_input(s);
        set_events(s2);
    });
    // Input form events
    s.comp.input.onceKey('enter', async () => {
        const line = s.comp.input.getText().trim();
        const s2 = await input_handler(s, line);
        set_events(s2);
    });
    s.comp.input.onceKey([s.config.keys.screen.input], async () => {
        const s2 = hide_input(s);
        set_events(s2);
    });
}
/**
 * @description Initialize
 * @param s State
 */
async function init(s) {
    set_events(s);
    s.scr.render();
    const s2 = await search_streams(s, s.flags.last_search);
    set_events(s2);
}
/**
 * @description Initialize program state
 * @param config Configuration file
 * @param argv Command line arguments
 */
function init_state(config, argv) {
    // Declare here in order to reduce startup time by 50ms or so
    const Blessed = require('blessed');
    const scr = Blessed.screen({
        autoPadding: true,
        debug: false,
        fullUnicode: true,
        //forceUnicode: true,
        smartCSR: true,
    });
    // Blessed components
    const comp = {
        header: Blessed.listbar(Style.style.header),
        stream_table: Blessed.listtable(Style.style.stream_table),
        input: Blessed.textarea(Style.style.input),
        loading: Blessed.loading(Style.style.loading)
    };
    scr.append(comp.header);
    scr.append(comp.stream_table);
    scr.append(comp.input);
    scr.append(comp.loading);
    comp.stream_table.focus();
    return {
        scr,
        comp,
        config,
        stream_list: [],
        flags: {
            last_search: argv.q || config.default_search,
            last_tab: argv.s || config.default_source,
            source: argv.s || config.default_source,
            current_index: 0,
            is_playing: false,
            is_paused: false,
            is_input: false
        }
    };
}
/**
 * @description Main
 **/
function main() {
    const available_opts = ['h', 'q', 's', '_'];
    const argv = minimist_1.default(process.argv);
    if (argv.h
        || !!Object.keys(argv).find((opt) => !available_opts.includes(opt)))
        print_usage_and_exit();
    else {
        const config = Util.read_config();
        const s = init_state(config, argv);
        init(s);
    }
}
main();
