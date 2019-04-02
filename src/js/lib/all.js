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
 * Query and parse Icecast and Shoutcast directories
 * @module Icecast
 **/
const request_1 = __importDefault(require("request"));
const JsonFile = __importStar(require("jsonfile"));
const child_process_1 = require("child_process");
const Util = __importStar(require("./util.js"));
const request_2 = __importDefault(require("request"));
var Icecast;
(function (Icecast) {
    /**
     * @method search_xiph
     * @description Search the xiph icecast directory
     * @param search Non-formatted query
     * @return Stream list promise
     **/
    function search_xiph(search) {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'GET',
                url: 'http://dir.xiph.org/search?search=' + search.split(' ').join('+')
            };
            request_1.default(options, (err, _, body) => {
                if (err)
                    reject(err);
                resolve(parse_xiph(body));
            });
        });
    }
    Icecast.search_xiph = search_xiph;
    /**
     * @method search_shoutcast
     * @description Search the shoutcast directory
     * @param search Non-formatted query
     * @return Stream list promise
     **/
    function search_shoutcast(search) {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                url: 'https://directory.shoutcast.com/Search/UpdateSearch',
                form: {
                    query: search.split(' ').join('+')
                }
            };
            request_1.default(options, (err, _, body) => {
                if (err)
                    reject(err);
                const json = JSON.parse(body);
                resolve(parse_shoutcast(json));
            });
        });
    }
    Icecast.search_shoutcast = search_shoutcast;
    function parse_xiph(body) {
        const host = 'http://dir.xiph.org';
        const rows = body.replace(/\n/g, '')
            .match(/<tr class="row\d+?">.+?<\/tr>/g);
        if (rows === null)
            return [];
        else
            return rows.map(entry => {
                let match = entry.match(/<span class="name"><a href="(.+?)" onclick=".+?">(.+?)<\/a>/);
                //if(match === null) return false;
                if (match === null)
                    throw "Couldn\'t parse XIPH";
                let [, homepage, name] = match;
                let m_listeners = entry.match(/<span class="listeners">\[(\d+).+?<\/span>/);
                let m_description = entry.match(/<p class="stream-description">(.+?)<\/p>/);
                let m_playing = entry.match(/<p class="stream-onair"><.+?>.+?<\/.+?>(.+?)<\/p>/);
                let m_url = entry.match(/.+<a href="(.+?\.m3u)"/);
                const listeners = m_listeners === null ? 'Null' : m_listeners[1];
                const description = m_description === null ? '' : m_description[1];
                const playing = m_playing === null ? '' : m_playing[1];
                const url = m_url === null ? 'Null' : host + m_url[1];
                return {
                    name: name.trim(),
                    homepage: homepage.trim(),
                    listeners: listeners.trim(),
                    description: description.trim(),
                    playing: playing.trim(),
                    url: url.trim(),
                    src: 'Icecast',
                    is_playlist: true
                };
            });
        //.filter( (entry) => entry !== false );
    }
    function parse_shoutcast(json) {
        return Object.keys(json).map((key) => ({
            name: json[key].Name,
            homepage: '',
            listeners: json[key].Listeners.toString(),
            description: '',
            playing: json[key].CurrentTrack,
            url: `http://yp.shoutcast.com/sbin/tunein-station.m3u?id=${json[key].ID}`,
            src: 'Shoutcast',
            is_playlist: true
        }));
    }
})(Icecast = exports.Icecast || (exports.Icecast = {}));
var Mplayer;
(function (Mplayer) {
    /**
     * Query and parse Icecast and Shoutcast directories
     * @module Mplayer
     **/
    // Load config
    const CONFIG = Util.read_config(Util.CONFIG_PATH);
    // Constants
    const DEF_CACHE = '1024';
    const DEF_WAIT_IO = 100;
    const CACHE_SIZE = CONFIG.mplayer.cache || DEF_CACHE; // Mplayer cache size in kb
    const WAIT_IO = CONFIG.mplayer.wait_io || DEF_WAIT_IO; // Time to wait after IO in ms
    // Global variables
    let mplayer;
    /**
     * @method mplayer_cmd
     * @description Try to find the mplayer command
     * @param config_path Configuration file mplayer path
     * @return cmd Mplayer command
     **/
    function mplayer_cmd(config_bin_path) {
        /**
         * Set to the path variable in config if it's defined
         **/
        if (config_bin_path !== '')
            return config_bin_path;
        else
            return 'mplayer';
    }
    /**
     * kill :: Function -> IO()
     * @method kill
     * @description Kill all mplayer processes
     * @param f (Optional) Callback function
     **/
    function kill(f) {
        const cmd = 'Taskkill /IM mplayer.exe /F';
        child_process_1.execSync(cmd);
        if (f)
            f();
    }
    Mplayer.kill = kill;
    /**
     * @method mplayer_stdin
     * @description Write a string to mplayer process stdin pipe
     * @param line         String to be written
     * @param f            (Optional) Callback function
     * @param call_no_init Call the callback even if mplayer is not initiated
     **/
    function mplayer_stdin(line, f, call_no_init) {
        if (mplayer !== undefined) {
            mplayer.stdin.write(line + '\n');
            if (f)
                setTimeout(f, WAIT_IO);
        }
        else {
            if (f && call_no_init)
                f();
        }
    }
    function init_mplayer(url, is_playlist, f) {
        if (mplayer !== undefined)
            throw Error('Mplayer already initiated.');
        const cmd = mplayer_cmd(CONFIG.mplayer.path);
        const args = ['-cache', CACHE_SIZE, '-slave'];
        const options = {
            detached: true,
            stdio: ['pipe', 'ignore', 'ignore']
        };
        mplayer = is_playlist
            ? child_process_1.spawn(cmd, args.concat('-playlist', url), options)
            : child_process_1.spawn(cmd, args.concat(url), options);
        if (f)
            setTimeout(f, WAIT_IO);
    }
    function loadfile(url, is_playlist, f) {
        const cmd = is_playlist ? 'loadlist' : 'loadfile';
        mplayer_stdin(`${cmd} ${url} 0`, f, true);
    }
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     * @param f (Optional) Callback function
     **/
    function play(url, is_playlist, f) {
        return new Promise((resolve) => {
            if (mplayer !== undefined)
                //stop( () => loadfile(url, is_playlist, f) );
                loadfile(url, is_playlist, f);
            else
                init_mplayer(url, is_playlist, f);
            resolve();
        });
    }
    Mplayer.play = play;
    /**
     * @method quit
     * @description Quit mplayer
     * @param f (Optional) Callback function
     **/
    function quit(f) {
        mplayer_stdin('quit', f, true);
    }
    Mplayer.quit = quit;
    /**
     * @method pause
     * @description Pause mplayer
     * @param f (Optional) Callback function
     **/
    function pause(f) {
        mplayer_stdin('pause', f, false);
    }
    Mplayer.pause = pause;
    /**
     * @method volume
     * @description Change volume
     * @param n Relative value to change volume by preceded by sign
     **/
    function volume(n) {
        mplayer_stdin(`volume ${n} 0`);
    }
    Mplayer.volume = volume;
    /**
     * @method stop
     * @description Stop mplayer
     * @param f (Optional) Callback function
     **/
    function stop(f) {
        mplayer_stdin('stop', f, true);
    }
    Mplayer.stop = stop;
})(Mplayer = exports.Mplayer || (exports.Mplayer = {}));
var Radio;
(function (Radio) {
    /**
    * Query and parse radio-browser open radio directory
    * @module Radio
    **/
    const DEF_MODE = 'name';
    const MODE_URL = {
        name: 'http://www.radio-browser.info/webservice/json/stations/byname/',
        tag: 'http://www.radio-browser.info/webservice/json/stations/bytag/',
        country: 'http://www.radio-browser.info/webservice/json/stations/bycountry/',
        language: 'http://www.radio-browser.info/webservice/json/stations/bylanguage/'
    };
    /**
    * @method search_radio
    * @description Search radio-browser.info for radio streams
    * @param search Non-formatted query
    * @param mode API Endpoint to query (name, tag, country, language)
    * @return Stream list promise
    **/
    function search_radio(search, mode) {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'GET',
                url: (MODE_URL[mode] || MODE_URL[DEF_MODE]) + search.split(' ').join('+')
            };
            request_2.default(options, (err, _, body) => {
                if (err)
                    reject(err);
                const json = JSON.parse(body);
                resolve(parse_radio(json));
            });
        });
    }
    Radio.search_radio = search_radio;
    function parse_radio(json) {
        return Object.keys(json).map((key) => ({
            name: json[key].name,
            bitrate: json[key].bitrate,
            homepage: json[key].homepage,
            url: json[key].url,
            src: 'Radio',
            is_playlist: /\.m3u|\.pls/.test(json[key].url)
        }));
    }
})(Radio = exports.Radio || (exports.Radio = {}));
var Style;
(function (Style) {
    /**
     * Style declarations for blessed
     * @module Style
     **/
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
    const config = Util.read_config(Util.CONFIG_PATH);
    Style.style = {
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
})(Style = exports.Style || (exports.Style = {}));
var _Util;
(function (_Util) {
    /**
     * Util
     * @module Util
     **/
    _Util.CONFIG_PATH = './src/js/config.json';
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
    _Util.read_config = read_config;
    /**
     * @description Format the window title line
     * @param src  Current source
     * @param name Entry name
     * @return Title line
     **/
    function format_title(s, name) {
        return `Net streams - ${s.flags.source}` + (name === '' ? '' : ` | ${name}`);
    }
    _Util.format_title = format_title;
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
    _Util.format_header = format_header;
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
    _Util.add_rows_padding = add_rows_padding;
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
    _Util.format_stream_list = format_stream_list;
})(_Util = exports._Util || (exports._Util = {}));
