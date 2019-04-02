import { RadioEntry } from './interfaces';
/**
* @method search_radio
* @description Search radio-browser.info for radio streams
* @param search Non-formatted query
* @param mode API Endpoint to query (name, tag, country, language)
* @return Stream list promise
**/
export declare function search_radio(search: string, mode: string): Promise<RadioEntry[]>;
