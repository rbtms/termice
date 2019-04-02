/**
 * Query and parse Icecast and Shoutcast directories
 * @module Icecast
 **/
import { IcecastEntry } from './interfaces';
/**
 * @method search_xiph
 * @description Search the xiph icecast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export declare function search_xiph(search: string): Promise<IcecastEntry[]>;
/**
 * @method search_shoutcast
 * @description Search the shoutcast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
export declare function search_shoutcast(search: string): Promise<IcecastEntry[]>;
