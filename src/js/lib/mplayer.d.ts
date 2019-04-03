declare class Mplayer {
    cache_size: string;
    wait_io: number;
    bin_path: string;
    pipe: any;
    is_init: boolean;
    constructor();
    /**
     * @method kill
     * @description Kill all mplayer processes
     **/
    kill(): Promise<void>;
    /**
     * @method mplayer_stdin
     * @description Write a string to mplayer process stdin pipe
     * @param line         String to be written
     * @param call_no_init WHether to succeed even if the mplayer pipe is not initiated
     **/
    mplayer_stdin(line: string, call_no_init?: boolean): Promise<void>;
    /**
     * @method init_player
     * @description Initialize mplayer pipe
     * @param url URL of the stream to play
     * @param is_playlist Whether if the stream is a playlist or not
     */
    init_mplayer(url: string, is_playlist: boolean): void;
    /**
     * @method load_line
     * @description Load a stream
     * @param url URL of the stream to play
     * @param is_playlist Whether if the stream is a playlist or not
     */
    load_file(url: string, is_playlist: boolean): Promise<void>;
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     **/
    play(url: string, is_playlist: boolean): Promise<void>;
    /**
     * @method quit
     * @description Quit mplayer
     **/
    quit(): Promise<void>;
    /**
     * @method pause
     * @description Pause mplayer
     **/
    pause(): Promise<void>;
    /**
     * @method volume
     * @description Change volume
     * @param n Relative value to change volume by preceded by sign
     **/
    volume(n: string): Promise<void>;
    /**
     * @method stop
     * @description Stop mplayer
     **/
    stop(): Promise<void>;
}
declare const _default: Mplayer;
export default _default;
