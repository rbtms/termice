"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
* Util
* @module Util
**/
const JsonFile = __importStar(require("jsonfile"));
/**
* read_config :: String -> IO JSON
* @description Read configuration file
**/
function read_config(path) {
    let config;
    try {
        config = JsonFile.readFileSync(path);
    }
    catch (err) {
        throw Error(`Couldn't load ${path}: ${err})`);
    }
    return Object.freeze(config);
}
exports.read_config = read_config;
