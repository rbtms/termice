"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
* Query and parse Icecast and Shoutcast directories
* @module Mplayer
**/
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const Util = __importStar(require("./util.js"));
// Load config
const CONFIG = Util.read_config('./config.json');
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
    switch (config_bin_path !== '') {
        case true: {
            return config_bin_path;
        }
        default: {
            switch (process.platform) {
                /**
                * Check if there is an executable in the bin folder,
                * fallback to "mplayer"
                **/
                case 'win32': {
                    try {
                        fs.statSync('bin/mplayer.exe');
                        return 'bin/mplayer.exe';
                    }
                    catch (err) {
                        return 'mplayer';
                    }
                }
                default: {
                    return 'mplayer';
                }
            }
        }
    }
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
exports.kill = kill;
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
    if (mplayer !== undefined) {
        //stop( () => loadfile(url, is_playlist, f) );
        loadfile(url, is_playlist, f);
    }
    else {
        init_mplayer(url, is_playlist, f);
    }
}
exports.play = play;
/**
* @method quit
* @description Quit mplayer
* @param f (Optional) Callback function
**/
function quit(f) {
    mplayer_stdin('quit', f, true);
}
exports.quit = quit;
/**
* @method pause
* @description Pause mplayer
* @param f (Optional) Callback function
**/
function pause(f) {
    mplayer_stdin('pause', f, false);
}
exports.pause = pause;
/**
* @method volume
* @description Change volume
* @param n Relative value to change volume by preceded by sign
**/
function volume(n) {
    mplayer_stdin(`volume ${n} 0`);
}
exports.volume = volume;
/**
* @method stop
* @description Stop mplayer
* @param f (Optional) Callback function
**/
function stop(f) {
    mplayer_stdin('stop', f, true);
}
exports.stop = stop;
