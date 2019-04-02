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
 * Style declarations for blessed
 * @module Style
 **/
const Util = __importStar(require("./util.js"));
function format_init_header(option) {
    const def_style = '{white-bg}{black-fg}';
    const pad = ' ';
    const line = Object.keys(option).reduce((acc, key) => acc + ` ${def_style} ${key} {/} ${option[key]}${pad}`, '');
    // Remove last space
    return line.substr(0, line.length - 1);
}
/*
 * Constants
 */
const config = Util.read_config();
exports.style = {
    header: {
        top: 0,
        left: 1,
        width: '99%',
        height: '8%',
        content: format_init_header(config.header),
        tags: true,
        padding: {
            left: 2
        },
        border: {
            type: 'bg'
        },
        style: {
            fg: 'white',
            bg: 'black',
            border: {
                fg: '#f0f0f0'
            },
            hover: {
                bg: 'green'
            }
        }
    },
    stream_table: {
        top: 3,
        left: 1,
        width: '99%',
        height: '90%',
        content: '  Loading...',
        align: 'left',
        keys: ['up', 'down'],
        tags: true,
        noCellBorders: true,
        border: {
            type: 'bg'
        },
        /*
            padding: {
                left: 2
            },
         */
        style: {
            fg: 'white',
            bg: 'blue',
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
                fg: 'black'
            }
        }
    },
    input: {
        bottom: 0,
        left: 1,
        width: '99%',
        height: 3,
        content: 'Input',
        tags: true,
        padding: {
            left: 2
        },
        hidden: true,
        inputOnFocus: true,
        border: {
            type: 'bg'
        },
        style: {
            fg: 'black',
            bg: 'white'
        }
    },
    loading: {
        bottom: 0,
        left: 1,
        width: '99%',
        height: 3,
        content: 'Input',
        tags: true,
        padding: {
            left: 2
        },
        hidden: true,
        inputOnFocus: true,
        border: {
            type: 'bg'
        },
        style: {
            fg: 'black',
            bg: 'white'
        }
    }
};
