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
 * Util
 * @module Util
 **/
const JsonFile = __importStar(require("jsonfile"));
exports.CONFIG_PATH = './src/js/config.json';
/**
 * @description Read configuration file
 **/
function read_config(path) {
    try {
        const config = JsonFile.readFileSync(path);
        return Object.freeze(config);
    }
    catch (err) {
        throw Error(`Couldn't load ${path}: ${err})`);
    }
}
exports.read_config = read_config;
