'use strict'

module.exports = {
    header: {
        top     : 0,
        left    : 1,
        width   : '98%',
        height  : 3,
        content : '{white-bg}{black-fg} Q {/} Exit '
                  + '{white-bg}{black-fg} Esc {/} Search '
                  + '{white-bg}{black-fg} I {/} Icecast '
                  + '{white-bg}{black-fg} S {/} Shoutcast '
                  + '{white-bg}{black-fg} R {/} Radio '
                  + '{white-bg}{black-fg} P {/} Refresh '
                  + '{white-bg}{black-fg} Sp {/} Pause '
                  + '{white-bg}{black-fg} K {/} Stop',
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
}