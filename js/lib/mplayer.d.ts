/**
* kill :: Function -> IO()
* @method kill
* @description Kill all mplayer processes
* @param f (Optional) Callback function
**/
export declare function kill(f: () => void): void;
/**
* @method play
* @description Play a url with mplayer
* @param url URL
* @param is_playlist Whether to launch mplayer with the -playlist argument
* @param f (Optional) Callback function
**/
export declare function play(url: string, is_playlist: boolean, f?: () => void): void;
/**
* @method quit
* @description Quit mplayer
* @param f (Optional) Callback function
**/
export declare function quit(f?: () => void): void;
/**
* @method pause
* @description Pause mplayer
* @param f (Optional) Callback function
**/
export declare function pause(f?: () => void): void;
/**
* @method volume
* @description Change volume
* @param n Relative value to change volume by preceded by sign
**/
export declare function volume(n: string): void;
/**
* @method stop
* @description Stop mplayer
* @param f (Optional) Callback function
**/
export declare function stop(f?: () => void): void;
