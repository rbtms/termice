'use strict'

const blessed = require('blessed');

const argv    = require('minimist')(process.argv);

const mplayer = require('./js/mplayer.js');
const icecast = require('./js/icecast.js');
const radio   = require('./js/radio.js');

const style   = require('./js/style.js');


/**
* @todo Testing     - Go to the last index when pressing up in the first index
* @todo Testing     - Fix set_title inside set_header
* @todo In progress - Catch errors
*
* @todo Update currently playing track information
* @todo Modularization?
* @todo Add currently playing bar?
* @todo Update frequently?
* @todo Remove layout-breaking characters
*
* @todo Add podcasts?
* @todo Add free music sources?
**/


// Constants
const s = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    fullUnicode: true,
    //warnings: true,
    //forceUnicode: true,
    dump: './log.txt',
    debug: true
});

const header       = blessed.listbar(style.header);
const stream_table = blessed.listtable(style.stream_table);
const input        = blessed.textarea(style.input);
const loading      = blessed.loading(style.input);


// Global variables
var LAST_SEARCH   = argv.q || 'anime';
var SOURCE        = argv.s || 'Shoutcast';
var LAST_ENTRY    = {};
var CURRENT_INDEX = 0;

var stream_list   = [];

// Global flags
var IS_PLAYING = false;
var IS_PAUSED  = false;
var IS_INPUT   = false;


function exit() {
    //mplayer.kill( () => {
    mplayer.stop( () => {
        process.exit(0);
    });
}

function stop() {
    mplayer.stop(() => {
        IS_PLAYING = false;
        
        // Update title
        set_title(SOURCE);
    });
}

function pause() {
    mplayer.pause(() => {
        IS_PAUSED = !IS_PAUSED;
        
        // Update pause key text
        set_header(SOURCE);
        set_title(SOURCE);
    });
}

function print_usage() {
    const usage = `
Usage: netstreams [ARGS]

Arguments:
  -q: Query
  -s: Source
`;
    
    console.log(usage);
}

/**
* set_header :: String -> IO()
* @description Set current tab in the header
* @param {String} tab Current tab
**/
function set_header(tab) {
    const def_style = '{white-bg}{black-fg}'; // Default style
    const sel_style = '{green-bg}{black-fg}'; // Selected style
    
    const options = [
        ['Q',     'Exit'],
        ['Esc',   'Search'],
        ['I',     'Icecast'],
        ['S',     'Shoutcast'],
        ['R',     'Radio'],
        ['P',     'Refresh'],
        ['Sp',    !IS_PAUSED ? 'Pause' : 'Resume'],
        ['K',     'Stop']
    ];
    
    
    var line = '';
    var key, option, style, pad;
    
    for(var i = 0; i < options.length; i++) {
        [key, option] = options[i];
        style         = option === tab ? sel_style : def_style;
        pad           = i === options.length-1 ? '' : ' ';
        
        line += `${style} ${key} {/} ${option}${pad}`;
    }
    
    
    header.setContent(line);
    s.render();
}

/**
* set_title :: String -> String -> IO()
* @description Set window title
* @param {String} src  Current source
* @param {String} name Entry name
**/
function set_title(src, name) {
    // Keep the old title if it's playing
    if(IS_PLAYING) return;
    
    name = name === undefined ? '' : ` | ${name}`;
    
    const line = `Net streams - ${src}${name}`;
    
    s.title = line;
}

/**
* display_rows :: [JSON] -> IO()
* @description Display <rows> in stream_table
* @param {Array} -> Array of JSON entries
**/
function display_rows(rows) {
    stream_table.setData(rows);
    s.render();
}

/**
* query_streams :: String -> String -> Promise
* @description Get streams from <src> and display them
* @param {String} search Search query
* @param {String} src    Stream source
* @return {Promise} Query promise
**/
function query_streams(search, src) {
    var p = '';
    
    
    switch(src) {
        case 'Icecast': {
            p = icecast.search_xiph(search);
            break;
        }
        case 'Shoutcast': {
            p = icecast.search_shoutcast(search);
            break;
        }
        case 'Radio': {
            // Parse mode
            var mode;
            
            const match = search.match(/^(.+?):(.+)$/);
            switch(!!match) {
                // There is a match
                case true: {
                    switch(match[1]) {
                        // It's a valid mode
                        case 'name':
                        case 'tag':
                        case 'country':
                        case 'language': {
                            mode   = match[1];
                            search = match[2];
                            break;
                        }
                        // It isn't a valid mode
                        default: {
                            mode = 'name';
                        }
                    }
                    
                    break;
                }
                // There is not a match
                default: {
                    mode = 'name';
                }
            }
            
            p = radio.search(search, mode);
            break;
        }
        default: {
            throw 'Source not recognized: ' + src;
        }
    }
    
    
    return p;
}


/**
* display_streams :: [JSON] -> String -> [JSON]
* @description Get streams from <src>
* @param {Array}  list Entry list
* @param {String} src  Stream source
**/
function process_list(list, search, src) {
    const pad = '  ';
    const is_icecast = (src == 'Icecast' || src == 'Shoutcast');
    
    var rows = is_icecast
        ? [ ['  Name', '  Playing', '  Listeners'] ]
        : [ ['  Name', '  Bitrate'] ];
    
    
    if(list.length > 0) {
        for(var i = 0; i < list.length; i++) {
            rows.push( is_icecast
                ? [
                    pad + list[i].name.substr(0, 30),
                    pad + list[i].playing.substr(0, 50),
                    //list[i].description.substr(0, 50),
                    pad + list[i].listeners.substr(0, 20)
                ]
                : [
                    pad + list[i].name.substr(0, 50),
                    pad + '   '.substr(list[i].bitrate.length) + list[i].bitrate + ' kbps'
                ]
            );
        }
    }
    else {
        rows.push(['  No results for: ' + search]);
    }
    
    
    return rows;
}

/**
* search_streams :: String -> String -> IO()
* @description Query source and display results
* @param {String} -> search Unformatted query string
* @param {String} -> src    Streams source
**/
function search_streams(search, src) {
    s.debug('Searching: ', search);
    loading.load('Searching: ' + search);
    
    // Update global variables
    LAST_SEARCH   = search;
    CURRENT_INDEX = 0;
    
    
    query_streams(search, src).then( (list) => {
        // Update current stream list for events
        stream_list = list;
        
        // Process the list and display it
        const rows = process_list(list, search, src);
        display_rows(rows);
            
        loading.stop();
        
        set_header(src);
        set_title(src);
    } )
    .catch( (err) => { s.debug('Error: ' + err); });
}

/**
* refresh_table :: IO()
* @description Refresh table with last query
**/
function refresh_table() {
    search_streams(LAST_SEARCH, SOURCE);
}

/**
* play_url :: String -> IO()
* @description Play a url with mplayer
* @param {JSON} entry Table entry
**/
function play_url(entry) {
    LAST_ENTRY = entry;
    
    mplayer.play(entry.url, entry.is_playlist, () => {
        IS_PLAYING = false;
        IS_PAUSED  = false;
        
        set_header(entry.src);
        set_title(entry.src, entry.name);
        
        IS_PLAYING = true;
    });
}

/**
* toggle_input :: String -> IO()
* @description Toggle the input textarea
**/
function toggle_input() {
    s.debug('toggle');
    
    // Toggle input
    input.toggle();
    s.render();
    
    // Enable input
    if(!IS_INPUT) input.input();
    
    // Change tab
    const tab = IS_INPUT ? SOURCE : 'Search';
    set_header(tab);
    set_title(tab);
    
    
    IS_INPUT = !IS_INPUT;
}

/**
* set_events :: IO()
* @description Set events
**/
function set_events() {
    // Screen events
    s.key(['q'],      exit);
    s.key(['escape'], toggle_input);
    s.key(['space'],  pause);
    s.key(['k'],      stop);
    s.key(['+'],      () => mplayer.volume('+1'));
    s.key(['-'],      () => mplayer.volume('-1'));
    
    // Stream table events
    stream_table.on('select', (e, i) => {
        const entry = stream_list[i-1];
        play_url(entry);
        
        s.debug('Playing: ', entry.url);
    });
    
    // Icecast tab
    stream_table.key('i', () => {
        SOURCE = 'Icecast';
        refresh_table();
    });
    
    // Shoutcast tab
    stream_table.key('s', () => {
        SOURCE = 'Shoutcast';
        refresh_table();
    });
    
    // Radio tab
    stream_table.key('r', () => {
        SOURCE = 'Radio';
        refresh_table();
    });
    
    // Arrow keys
    stream_table.key('up', () => {
        if(CURRENT_INDEX === 0) {
            // Select last index
            // Note: Up key event is triggered after the end of this function,
            //       because of that the index is stream_list.length and not
            //       stream_list.length-1
            
            CURRENT_INDEX = stream_list.length-1;
            stream_table.select(CURRENT_INDEX+1);
        }
        else {
            CURRENT_INDEX--;
        }
        
        s.debug(CURRENT_INDEX);
    });
    stream_table.key('down', () => {
        if(stream_list.length-1 == CURRENT_INDEX) {
            // Select first index
            CURRENT_INDEX = 0;
            stream_table.select(CURRENT_INDEX);
        }
        else {
            CURRENT_INDEX++;
        }
        
        s.debug(CURRENT_INDEX);
    });
    
    // Refresh table
    stream_table.key('p', () => {
        refresh_table();
    });
    
    // Input form events
    input.key('enter', () => {
        const str = input.getText().trim();
        input.clearValue();
        
        search_streams(str, SOURCE);
        
        toggle_input();
    });
}


/**
* Execution
**/
if(argv.h) {
    print_usage();
    process.exit();
}

//console.log(argv);
set_events();

// Initialize
s.append(header);
s.append(stream_table);
s.append(input);
s.append(loading);

stream_table.focus();

search_streams(LAST_SEARCH, SOURCE);

s.render();