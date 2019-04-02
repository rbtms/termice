/**
* Query and parse Icecast and Shoutcast directories
* @module Mplayer
**/
import * as fs from 'fs';
import {execSync, spawn} from 'child_process';
import * as Util from './util.js';


// Load config
const CONFIG = Util.read_config(Util.CONFIG_PATH);

// Constants
const DEF_CACHE   = '1024';
const DEF_WAIT_IO = 100;

const CACHE_SIZE = CONFIG.mplayer.cache   || DEF_CACHE;   // Mplayer cache size in kb
const WAIT_IO    = CONFIG.mplayer.wait_io || DEF_WAIT_IO; // Time to wait after IO in ms


// Global variables
let mplayer :any;


/**
* @method mplayer_cmd
* @description Try to find the mplayer command
* @param config_path Configuration file mplayer path
* @return cmd Mplayer command
**/
function mplayer_cmd(config_bin_path :string) :string {
    /**
    * Set to the path variable in config if it's defined
    **/
    switch(config_bin_path !== '') {
        case true: {
            return config_bin_path;
        }
        default: {
            switch(process.platform) {
                /**
                * Check if there is an executable in the bin folder,
                * fallback to "mplayer"
                **/
                case 'win32': {
                    try {
                        fs.statSync('bin/mplayer.exe');
                        
                        return 'bin/mplayer.exe';
                    }
                    catch(err) {
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
export function kill(f : () => void) :void {
    const cmd = 'Taskkill /IM mplayer.exe /F';
    execSync(cmd);
    
    if(f) f();
}

/**
* @method mplayer_stdin
* @description Write a string to mplayer process stdin pipe
* @param line         String to be written
* @param f            (Optional) Callback function
* @param call_no_init Call the callback even if mplayer is not initiated
**/
function mplayer_stdin(line :string, f? : () => void, call_no_init? :boolean) :void {
    if(mplayer !== undefined) {
        mplayer.stdin.write(line + '\n');
        
        if(f) setTimeout(f, WAIT_IO);
    }
    else {
        if(f && call_no_init) f();
    }
}

function init_mplayer(url :string, is_playlist :boolean, f? : () => void) :void {
    if(mplayer !== undefined) throw Error('Mplayer already initiated.');
    
    const cmd     = mplayer_cmd(CONFIG.mplayer.path);
    const args    = ['-cache', CACHE_SIZE, '-slave'];
    const options = {
        detached : true,
        stdio    : ['pipe', 'ignore', 'ignore']
    };
    
    mplayer = is_playlist
        ? spawn(cmd, args.concat('-playlist', url), options)
        : spawn(cmd, args.concat(url), options);
    
    if(f) setTimeout(f, WAIT_IO);
}

function loadfile(url :string, is_playlist :boolean, f? : () => void) :void {
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
export function play(url :string, is_playlist :boolean, f? : () => void) :void {
    if(mplayer !== undefined) {
        //stop( () => loadfile(url, is_playlist, f) );
        loadfile(url, is_playlist, f);
    }
    else {
        init_mplayer(url, is_playlist, f);
    }
}

/**
* @method quit
* @description Quit mplayer
* @param f (Optional) Callback function
**/
export function quit(f? : () => void) :void {
    mplayer_stdin('quit', f, true);
}

/**
* @method pause
* @description Pause mplayer
* @param f (Optional) Callback function
**/
export function pause(f? : () => void) :void {
    mplayer_stdin('pause', f, false);
}

/**
* @method volume
* @description Change volume
* @param n Relative value to change volume by preceded by sign
**/
export function volume(n :string) :void {
    mplayer_stdin(`volume ${n} 0`);
}

/**
* @method stop
* @description Stop mplayer
* @param f (Optional) Callback function
**/
export function stop(f? : () => void) :void {
    mplayer_stdin('stop', f, true);
}
