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
 * Query and parse Icecast and Shoutcast directories
 * @module Mplayer
 **/
const child_process_1 = require("child_process");
const Util = __importStar(require("./util.js"));
class Mplayer {
    constructor() {
        const config = Util.read_config();
        // Default cache in kb
        this.def_cache = '1024';
        // Time to wait after IO
        this.def_wait_io = 100;
        // Mplayer cache size in kb
        this.cache_size = config.mplayer.cache || this.def_cache;
        // Time to wait after IO in ms
        this.wait_io = config.mplayer.wait_io || this.def_wait_io;
        // Path to the mplayer binary
        this.bin_path = config.mplayer.path || 'mplayer';
        this.pipe;
        this.is_init = false;
    }
    /**
     * @method kill
     * @description Kill all mplayer processes
     * @param f (Optional) Callback function
     **/
    // TODO: Dont kill all processes
    async kill() {
        const cmd = 'killall mplayer';
        return new Promise((resolve, reject) => {
            child_process_1.exec(cmd, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    /**
     * @method mplayer_stdin
     * @description Write a string to mplayer process stdin pipe
     * @param line         String to be written
     * @param f            (Optional) Callback function
     * @param call_no_init Call the callback even if mplayer is not initiated
     **/
    async mplayer_stdin(line, call_no_init) {
        return new Promise((resolve, reject) => {
            if (!this.is_init) {
                this.pipe.stdin.write(line + '\n');
                setTimeout(resolve, this.wait_io);
            }
            else if (call_no_init) {
                resolve();
            }
            else {
                reject(Error('mplayer_stdin: Idk why this fails.'));
            }
        });
    }
    init_mplayer(url, is_playlist) {
        if (this.is_init) {
            throw Error('Mplayer already initiated.');
        }
        else {
            const args = ['-cache', this.cache_size, '-slave'];
            const options = {
                detached: true,
                stdio: ['pipe', 'ignore', 'ignore']
            };
            this.pipe = is_playlist
                ? child_process_1.spawn(this.bin_path, args.concat('-playlist', url), options)
                : child_process_1.spawn(this.bin_path, args.concat(url), options);
            this.is_init = true;
        }
    }
    async loadfile(url, is_playlist) {
        const cmd = is_playlist ? 'loadlist' : 'loadfile';
        await this.mplayer_stdin(`${cmd} ${url} 0`, true);
    }
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     * @param f (Optional) Callback function
     **/
    play(url, is_playlist) {
        return new Promise(async (resolve) => {
            if (!this.is_init) {
                //stop( () => loadfile(url, is_playlist, f) );
                await this.loadfile(url, is_playlist);
                resolve();
            }
            else {
                this.init_mplayer(url, is_playlist);
                resolve();
            }
        });
    }
    /**
     * @method quit
     * @description Quit mplayer
     * @param f (Optional) Callback function
     **/
    async quit() {
        return this.mplayer_stdin('quit', true);
    }
    /**
     * @method pause
     * @description Pause mplayer
     * @param f (Optional) Callback function
     **/
    async pause() {
        return this.mplayer_stdin('pause', false);
    }
    /**
     * @method volume
     * @description Change volume
     * @param n Relative value to change volume by preceded by sign
     **/
    async volume(n) {
        return this.mplayer_stdin(`volume ${n} 0`);
    }
    /**
     * @method stop
     * @description Stop mplayer
     * @param f (Optional) Callback function
     **/
    async stop() {
        return this.mplayer_stdin('stop', true);
    }
}
exports.default = new Mplayer();
