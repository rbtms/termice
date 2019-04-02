declare class Mplayer {
    def_cache: string;
    def_wait_io: number;
    cache_size: string;
    wait_io: number;
    bin_path: string;
    pipe: any;
    is_init: boolean;
    constructor();
    /**
     * @method kill
     * @description Kill all mplayer processes
     * @param f (Optional) Callback function
     **/
    kill(): Promise<void>;
    /**
     * @method mplayer_stdin
     * @description Write a string to mplayer process stdin pipe
     * @param line         String to be written
     * @param f            (Optional) Callback function
     * @param call_no_init Call the callback even if mplayer is not initiated
     **/
    mplayer_stdin(line: string, call_no_init?: boolean): Promise<void>;
    init_mplayer(url: string, is_playlist: boolean): void;
    loadfile(url: string, is_playlist: boolean): Promise<void>;
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     * @param f (Optional) Callback function
     **/
    play(url: string, is_playlist: boolean): Promise<void>;
    /**
     * @method quit
     * @description Quit mplayer
     * @param f (Optional) Callback function
     **/
    quit(): Promise<void>;
    /**
     * @method pause
     * @description Pause mplayer
     * @param f (Optional) Callback function
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
     * @param f (Optional) Callback function
     **/
    stop(): Promise<void>;
}
declare const _default: Mplayer;
export default _default;
