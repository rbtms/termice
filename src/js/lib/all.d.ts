export declare namespace Icecast {
    /**
     * @method search_xiph
     * @description Search the xiph icecast directory
     * @param search Non-formatted query
     * @return Stream list promise
     **/
    function search_xiph(search: string): Promise<IcecastEntry[]>;
    /**
     * @method search_shoutcast
     * @description Search the shoutcast directory
     * @param search Non-formatted query
     * @return Stream list promise
     **/
    function search_shoutcast(search: string): Promise<IcecastEntry[]>;
}
export interface State {
    scr: any;
    comp: any;
    config: Config;
    stream_list: Entry[];
    flags: Flags;
}
export interface Config {
    [propName: string]: any;
}
export interface Flags {
    last_search: string;
    last_tab: string;
    source: string;
    current_index: number;
    is_playing: boolean;
    is_paused: boolean;
    is_input: boolean;
}
export interface Entry {
    name: string;
    homepage?: string;
    listeners?: string;
    description?: string;
    playing?: string;
    url: string;
    src: string;
    bitrate?: string;
    is_playlist: boolean;
}
export interface IcecastEntry {
    name: string;
    homepage: string;
    listeners: string;
    description: string;
    playing: string;
    url: string;
    src: string;
    is_playlist: boolean;
}
export interface RadioEntry {
    name: string;
    homepage: string;
    url: string;
    src: string;
    bitrate: string;
    is_playlist: boolean;
}
export interface StringJSON {
    [propName: string]: string;
}
export interface AnyJSON {
    [propName: string]: any;
}
export declare namespace Mplayer {
    /**
     * kill :: Function -> IO()
     * @method kill
     * @description Kill all mplayer processes
     * @param f (Optional) Callback function
     **/
    function kill(f: () => void): void;
    /**
     * @method play
     * @description Play a url with mplayer
     * @param url URL
     * @param is_playlist Whether to launch mplayer with the -playlist argument
     * @param f (Optional) Callback function
     **/
    function play(url: string, is_playlist: boolean, f?: () => void): Promise<void>;
    /**
     * @method quit
     * @description Quit mplayer
     * @param f (Optional) Callback function
     **/
    function quit(f?: () => void): void;
    /**
     * @method pause
     * @description Pause mplayer
     * @param f (Optional) Callback function
     **/
    function pause(f?: () => void): void;
    /**
     * @method volume
     * @description Change volume
     * @param n Relative value to change volume by preceded by sign
     **/
    function volume(n: string): void;
    /**
     * @method stop
     * @description Stop mplayer
     * @param f (Optional) Callback function
     **/
    function stop(f?: () => void): void;
}
export declare namespace Radio {
    /**
    * @method search_radio
    * @description Search radio-browser.info for radio streams
    * @param search Non-formatted query
    * @param mode API Endpoint to query (name, tag, country, language)
    * @return Stream list promise
    **/
    function search_radio(search: string, mode: string): Promise<RadioEntry[]>;
}
export declare namespace Style {
    const style: AnyJSON;
}
export declare namespace _Util {
    /**
     * Util
     * @module Util
     **/
    const CONFIG_PATH = "./src/js/config.json";
    /**
     * @description Read configuration file
     **/
    function read_config(path: string): AnyJSON;
    /**
     * @description Format the window title line
     * @param src  Current source
     * @param name Entry name
     * @return Title line
     **/
    function format_title(s: State, name: string): string;
    /**
     * @description Format header line
     * @param tab       Current tab
     * @param option    Option key-value pairs
     * @param pause_key Header key text of the pause key
     * @param is_paused Whether the player is currently paused or not
     * @return Formatted header line
     **/
    function format_header(tab: string, option: StringJSON, pause_key: string, is_paused: boolean): string;
    /**
     * @description Add left padding to stream_table cells
     * @param rows_header Header
     * @param rows        Table rows
     * @return Padded table rows
     **/
    function add_rows_padding(rows_header: string[], rows: string[][]): string[][];
    /**
     * @description Get streams from <src>
     * @param list        Entry list
     * @param rows_header Rows header
     * @param search      Query search
     * @return Array of JSON Entries
     **/
    function format_stream_list(s: State, list: Entry[], rows_header: string[], search: string): (string[][] | false);
}
