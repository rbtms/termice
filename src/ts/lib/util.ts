/**
 * Util
 * @module Util
 **/
import * as JsonFile from 'jsonfile';
import { AnyJSON } from './interfaces';

export const CONFIG_PATH = './src/js/config.json';

/**
 * @description Read configuration file
 **/
export function read_config(path :string) :AnyJSON {
  try {
    const config = JsonFile.readFileSync(path);
    return Object.freeze(config);
  }
  catch(err) {
    throw Error(`Couldn't load ${path}: ${err})`);
  }
}

