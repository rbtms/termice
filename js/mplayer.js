const fs    = require('fs');
const path  = require('path');
const exec  = require('child_process').exec;
const spawn = require('child_process').spawn;


/**
* TODO
*
* In progress
* - Wait for some time after io
*
**/


// Constants
const KILL_CMD = 'Taskkill /IM mplayer.exe /F';
const WAIT_IO  = 100;

// Global variables
var mplayer;


// kill :: Function -> IO()
function kill(f) {
    exec(KILL_CMD, f);
}

// play :: String -> Bool -> Function? -> IO()
function play(url, is_playlist, f) {
    var args = is_playlist
        ? ['-slave', '-playlist', url]
        : ['-slave', url];
    
    stop( () => {
        mplayer = spawn('mplayer', args, {
            detached : true,
            stdio    : ['pipe', 'ignore', 'ignore']
        });
        
        if(f !== undefined) setTimeout(f, WAIT_IO);
    });
}

// pause :: IO()
function pause(f) {
    if(mplayer !== undefined) {
        mplayer.stdin.write('pause\n');
        
        if(f !== undefined) setTimeout(f, WAIT_IO);
    }
}

// volume :: String -> IO()
function volume(n) {
    if(mplayer !== undefined) {
        mplayer.stdin.write('volume ' + n + ' 0\n');
    }
}

// stop :: Function? -> IO()
function stop(f) {
    if(mplayer !== undefined) {
        mplayer.stdin.write('stop\n');
        mplayer = undefined;
        
        if(f !== undefined) setTimeout(f, WAIT_IO);
    }
    else {
        if(f !== undefined) setTimeout(f, WAIT_IO);
    }
}


module.exports = {
    play     : play,
    stop     : stop,
    pause    : pause,
    volume   : volume,
    kill     : kill
}