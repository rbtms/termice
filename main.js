const blessed = require('blessed');

const mplayer = require('./js/mplayer.js');
const icecast = require('./js/icecast.js');
const radio   = require('./js/radio.js');

const style   = require('./js/style.js');

/**
* TODO
*
* In progress
* - Update currently playing track information
* - Catch errors
*
* - Add currently playing bar?
* - Update frequently?
* - Go to the last index when pressing up in the first index
* - Remove illegal characters
* - Fix set_title inside set_header
*
* - Add podcasts?
* - Add free music sources?
*
**/


/**
* Constants
**/
const s = blessed.screen({
    smartCSR: true,
    autoPadding: true,
    fullUnicode: true,
    //warnings: true,
    //forceUnicode: true,
    debug: true
});

const header       = blessed.listbar(style.header);
const stream_table = blessed.listtable(style.stream_table);
const input        = blessed.textarea(style.input);

/**
* Global variables
**/
var stream_list = [];

var LAST_SEARCH = process.argv[2] || 'anime';
var LAST_ENTRY  = {};
var SOURCE      = process.argv[3] || 'Shoutcast';
var IS_PLAYING  = false;
var IS_PAUSED   = false;
var IS_INPUT    = false;


function exit() {
    //mplayer.kill( () => {
    mplayer.stop( () => {
        process.exit(0);
    })
}

function stop() {
    mplayer.stop(() => {
        IS_PLAYING = false;
        
        set_title(SOURCE);
    });
}

function pause() {
    mplayer.pause(() => {
        IS_PAUSED = !IS_PAUSED;
        set_header(SOURCE);
    });
}

// set_header :: String -> IO()
// Set current tab in the header
function set_header(src) {
    var pad       = '  ';
    var def_style = '{white-bg}{black-fg}';
    var sel_style = '{green-bg}{black-fg}';
    
    var options = [
        ['Q',     'Exit'],
        ['Esc',   'Search'],
        ['I',     'Icecast'],
        ['S',     'Shoutcast'],
        ['R',     'Radio'],
        ['P',     'Refresh'],
        ['Sp',    !IS_PAUSED ? 'Pause' : 'Resume'],
        ['K',     'Stop']
    ];
    
    
    var line = pad;
    for(var i = 0; i < options.length; i++) {
        var [key, option] = options[i];
        var style = option.toLowerCase() === src.toLowerCase()
            ? sel_style
            : def_style;
        
        line += style + ' ' + key + ' {/} ' + option;
        if(i !== options.length-1) line += ' ';
    }
    
    //set_title(src);
    header.setContent(line);
    s.render();
}

// set_title :: String -> String -> IO()
function set_title(src, name) {
    if(IS_PLAYING) return;
    var line;
    
    switch(name === undefined) {
        case true: {
            line = 'Net streams - ' + src
            break;
        }
        default: {
            line = 'Net streams - ' + src + ' (' + name + ')'
        }
    }
    
    s.title = line;
}

// search_streams :: String -> String -> IO()
// Get streams from <src> and display them
function search_streams(search, src) {
    var p = '';
    
    s.debug('Searching: ', search);
    LAST_SEARCH = search;
    
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
            
            var match = search.match(/^(.+?):(.+)$/);
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
            
            s.debug('mode: ' + mode+'.');
            s.debug('search: ' + search+'.');
            
            p = radio.search(search, mode);
            break;
        }
        default: {
            throw 'Source not recognized: ' + src;
        }
    }
    
    p.then( (list) => {
        stream_list = list;
        
        set_header(src);
        
        var pad = '  ';
        var is_icecast = (src == 'Icecast' || src == 'Shoutcast')
        
        var rows = is_icecast
            ? [ ['  Name', '  Playing', '  Listeners'] ]
            : [ ['  Name', '  Bitrate'] ]
        
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
        
        stream_table.setData(rows);
        s.render();
    }).catch( (err) => { s.debug('Error: ' + err); });
}

// refresh_table :: IO()
function refresh_table() {
    search_streams(LAST_SEARCH, SOURCE);
}

// play_url :: String -> IO()
function play_url(entry) {
    LAST_ENTRY = entry;
    
    mplayer.play(entry.url, entry.is_playlist, () => {
        IS_PLAYING = false;
        IS_PAUSED  = false;
        
        set_title(entry.src, entry.name);
        set_header(entry.src);
        
        IS_PLAYING = true;
    });
}

// toggle_input :: String -> IO()
function toggle_input(str) {
    s.debug('toggle');
    
    if(!IS_INPUT) {
        input.show();
        set_header('Search');
        
        s.render();
        
        input.input();
    }
    else {
        input.hide();
        set_header(SOURCE);
        
        s.render();
    }
    
    IS_INPUT = !IS_INPUT;
}


/**
* Execution
**/

// Screen events
s.key(['q'],      exit);
s.key(['escape'], toggle_input);
s.key(['space'],  pause);
s.key(['k'],      stop);
s.key(['+'],      () => mplayer.volume('+1'));
s.key(['-'],      () => mplayer.volume('-1'));

// Stream table events
stream_table.on('select', (e, i) => {
    var entry = stream_list[i-1];
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
// Up key
stream_table.key('up', (a, b, c) => {
    var i = stream_table.getItem();
    s.debug(i);
})
// Refresh table
stream_table.key('p', () => {
    refresh_table();
});

// Input form events
input.key('enter', () => {
    var str = input.getText().trim();
    input.clearValue();
    
    search_streams(str, SOURCE);
    
    toggle_input();
});


// Initialize
s.append(header);
s.append(stream_table);
s.append(input);

stream_table.focus();

search_streams(LAST_SEARCH, SOURCE);

s.render();