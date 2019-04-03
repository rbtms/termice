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
        const def_cache = '1024';
        // Time to wait after IO
        const def_wait_io = 100;
        // Mplayer cache size in kb
        this.cache_size = config.mplayer.cache || def_cache;
        // Time to wait after IO in ms
        this.wait_io = config.mplayer.wait_io || def_wait_io;
        // Path to the mplayer binary
        this.bin_path = config.mplayer.path || 'mplayer';
        this.is_init = false;
    }
    /**
     * @method kill
     * @description Kill all mplayer processes
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
     * @param call_no_init WHether to succeed even if the mplayer pipe is not initiated
     **/
    mplayer_stdin(line, call_no_init = false) {
        return new Promise((resolve, reject) => {
            if (this.is_init) {
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
    /**
     * @method init_player
     * @description Initialize mplayer pipe
     * @param url URL of the stream to play
     * @param is_playlist Whether if the stream is a playlist or not
     */
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
                ? child_process_1.spawnSync(this.bin_path, args.concat('-playlist', url), options)
                : child_process_1.spawnSync(this.bin_path, args.concat(url), options);
            this.is_init = true;
        }
    }
    /**
     * @method load_line
     * @description Load a stream
     * @param url URL of the stream to play
     * @param is_playlist Whether if the stream is a playlist or not
     */
    async load_file(url, is_playlist) {
        const cmd = is_playlist ? 'loadlist' : 'loadfile';
        return this.mplayer_stdin(`${cmd} ${url} 0`, true);
    }
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     **/
    play(url, is_playlist) {
        return new Promise(async (resolve, reject) => {
            if (this.is_init) {
                //stop( () => load_file(url, is_playlist, f) );
                try {
                    await this.load_file(url, is_playlist);
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
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
     **/
    async quit() {
        return this.mplayer_stdin('quit', true);
    }
    /**
     * @method pause
     * @description Pause mplayer
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
        return this.mplayer_stdin(`volume ${n} 0`, false);
    }
    /**
     * @method stop
     * @description Stop mplayer
     **/
    async stop() {
        return this.mplayer_stdin('stop', true);
    }
}
exports.default = new Mplayer();
