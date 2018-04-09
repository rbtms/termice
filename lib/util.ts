/**
* Util
* @module Util
**/
import * as JsonFile from 'jsonfile';


/**
* @description Read configuration file
**/
export function read_config(path :string) :AnyJSON {
    let config :AnyJSON;
    
    try { config = JsonFile.readFileSync(path); }
    catch(err) { throw Error(`Couldn't load ${path}: ${err})`); }
    
    return Object.freeze(config);
}
