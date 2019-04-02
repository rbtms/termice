import { State, Entry, StringJSON, AnyJSON } from './interfaces';
export declare const CONFIG_PATH = "./src/js/config.json";
/**
 * @description Read configuration file
 **/
export declare function read_config(path: string): AnyJSON;
/**
 * @description Format the window title line
 * @param src  Current source
 * @param name Entry name
 * @return Title line
 **/
export declare function format_title(s: State, name: string): string;
/**
 * @description Format header line
 * @param tab       Current tab
 * @param option    Option key-value pairs
 * @param pause_key Header key text of the pause key
 * @param is_paused Whether the player is currently paused or not
 * @return Formatted header line
 **/
export declare function format_header(tab: string, option: StringJSON, pause_key: string, is_paused: boolean): string;
/**
 * @description Add left padding to stream_table cells
 * @param rows_header Header
 * @param rows        Table rows
 * @return Padded table rows
 **/
export declare function add_rows_padding(rows_header: string[], rows: string[][]): string[][];
/**
 * @description Get streams from <src>
 * @param list        Entry list
 * @param rows_header Rows header
 * @param search      Query search
 * @return Array of JSON Entries
 **/
export declare function format_stream_list(s: State, list: Entry[], rows_header: string[], search: string): (string[][] | false);
