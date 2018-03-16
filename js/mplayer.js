/**
* Query and parse Icecast and Shoutcast directories
* @module Mplayer
**/
'use strict';

const fs       = require('fs');
const jsonfile = require('jsonfile');
const path     = require('path');
const exec     = require('child_process').exec;
const spawn    = require('child_process').spawn;


// Load config
var config;

try { config = jsonfile.readFileSync('./config.json'); }
catch(err) { throw 'Couldn\'t load config.json: ' + err; }

// Prevent properties from being modified
Object.freeze(config);


// Constants
const CACHE_SIZE = config.mplayer.cache   || '1024'; // Mplayer cache size in kb
const WAIT_IO    = config.mplayer.wait_io || 100;    // Time to wait after IO in ms


// Global variables
var mplayer;


/**
* mplayer_cmd :: String -> String
* @method mplayer_cmd
* @description Try to find the mplayer command
* @param {JSON} config_path Configuration file mplayer path
* @return {String} cmd Mplayer command
**/
function mplayer_cmd(config_path) {
    var cmd;
    
    /**
    * Set to the path variable in config if it's defined
    **/
    switch(config.mplayer.path !== "") {
        case true: {
            cmd = config.mplayer.path;
            break;
        }
        default: {
            switch(process.platform) {
                /**
                * Check if there is an executable in the bin folder,
                * fallback to "mplayer"
                **/
                case "win32": {
                    try {
                        fs.statSync('bin/mplayer.exe');
                        cmd = 'bin/mplayer.exe';
                    }
                    catch(err) {
                        cmd = 'mplayer';
                    }
                    
                    break;
                }
                default: {
                    cmd = "mplayer";
                }
            }
        }
    }
    
    return cmd;
}

/**
* kill :: Function -> IO()
* @method kill
* @description Kill all mplayer processes
* @param {Function} f (Optional) Callback function
**/
function kill(f) {
    var cmd = 'Taskkill /IM mplayer.exe /F';
    exec(cmd, f);
}

/**
* mplayer_stdin :: String -> Function -> Bool -> IO()
* @method mplayer_stdin
* @description Write a string to mplayer process stdin pipe
* @param {String}   line         String to be written
* @param {Function} f            (Optional) Callback function
* @param {Function} call_no_init Call the callback even if mplayer is not initiated
**/
function mplayer_stdin(line, f, call_no_init) {
    if(mplayer !== undefined) {
        mplayer.stdin.write(line + '\n');
        
        if(f) setTimeout(f, WAIT_IO);
    }
    else {
        if(f && call_no_init) f();
    }
}

// init_mplayer :: String -> Bool -> Function? -> IO()
function init_mplayer(url, is_playlist, f) {
    if(mplayer !== undefined) throw 'Mplayer already initiated.';
    
    var args = ['-cache', CACHE_SIZE, '-slave'];
    var cmd  = mplayer_cmd(config.mplayer.path);
    
    if(is_playlist) {
        args.push('-playlist', url);
    }
    else {
        args.push(url);
    }
    
    mplayer = spawn(cmd, args, {
        detached : true,
        stdio    : ['pipe', 'ignore', 'ignore']
    });
    
    
    if(f !== undefined) setTimeout(f, WAIT_IO);
}

// loadfile :: String -> Bool -> Function? -> IO()
function loadfile(url, is_playlist, f) {
    const cmd = is_playlist ? 'loadlist' : 'loadfile';
    
    mplayer_stdin(`${cmd} ${url} 0`, f, true);
}

/**
* play :: String -> Bool -> Function? -> IO()
* @method play
* @description Play a url with mplayer
* @param {String}   url URL
* @param {Bool}     is_playlist Whether to launch mplayer with the -playlist argument
* @param {Function} f (Optional) Callback function
**/
function play(url, is_playlist, f) {
    if(mplayer !== undefined) {
        //stop( () => loadfile(url, is_playlist, f) );
        loadfile(url, is_playlist, f);
    }
    else {
        init_mplayer(url, is_playlist, f);
    }
}

/**
* quit :: Function? -> IO()
* @method quit
* @description Quit mplayer
* @param {Function} f (Optional) Callback function
**/
function quit(f) { mplayer_stdin('quit', f, true); }

/**
* pause :: Function? -> IO()
* @method pause
* @description Pause mplayer
* @param {Function} f (Optional) Callback function
**/
function pause(f) { mplayer_stdin('pause', f, false); }

/**
* volume :: String -> IO()
* @method volume
* @description Change volume
* @param {String} n Relative value to change volume by preceded by sign
**/
function volume(n) { mplayer_stdin(`volume ${n} 0`); }

/**
* stop :: Function? -> IO()
* @method stop
* @description Stop mplayer
* @param {Function} f (Optional) Callback function
**/
function stop(f) { mplayer_stdin('stop', f, true); }


module.exports = {
    play     : play,
    stop     : stop,
    pause    : pause,
    volume   : volume,
    kill     : kill,
    quit     : quit
};