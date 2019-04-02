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
