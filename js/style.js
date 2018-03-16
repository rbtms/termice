'use strict';

const jsonfile = require('jsonfile');


// Constants
var config;

try { config = jsonfile.readFileSync('./config.json'); }
catch(err) { throw 'Couldn\'t load config.json: ' + err; }

// Prevent properties from being modified
Object.freeze(config);


// format_header :: String
function format_header(option) {
    const def_style = '{white-bg}{black-fg}';
    const pad = ' ';
    
    var line = '';

    for(var key in option) {
        line += `${def_style} ${key} {/} ${option[key]}${pad}`;
    }
    
    
    // Remove last space
    return line.substr(0, line.length-1);
}


module.exports = {
    header: {
        top     : 0,
        left    : 1,
        width   : '98%',
        height  : 3,
        content : format_header(config.header),
        tags    : true,
        
        padding: {
            left: 2
        },
        
        border: {
            type: 'line'
        },
        
        style: {
            fg : 'white',
            bg : 'black',
            
            border: {
                fg: '#f0f0f0'
            },
            hover: {
                bg: 'green'
            }
        }
    },

    stream_table: {
        top     : 3,
        left    : 1,
        width   : '98%',
        height  : 24,
        content : '  Loading...',
        align   : 'left',
        keys    : ['up', 'down'],
        tags    : true,
        
        border: {
            type: 'line'
        },
        
        /*
        padding: {
            left: 2
        },
        */
        
        style: {
            fg : 'white',
            bg : 'blue',
            
            border: {
                fg: '#f0f0f0'
            },
            hover: {
                bg: 'green'
            },
            
            //header: {
            //    align: 'center'
            //}
            
            header: {
                bg: '#aaaaaa',
                fg: 'black'
            },
            cell: {
                fg: 'green'
            }
        }
    },
    
    input: {
        bottom  : 0,
        left    : 1,
        width   : '98%',
        height  : 3,
        content : 'Input',
        tags    : true,
        
        padding: {
            left: 2
        },
        
        hidden: true,
        
        inputOnFocus: true,
        
        border: {
            type: 'bg'
        },
        
        style: {
            fg : 'black',
            bg : 'white'
        }
    }
};