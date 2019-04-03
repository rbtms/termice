"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
/**
 * @method search_xiph
 * @description Search the xiph icecast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
function search_xiph(search) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            url: 'http://dir.xiph.org/search?search=' + search.split(' ').join('+')
        };
        require('request')(options, (err, _, body) => {
            if (err)
                reject(err);
            resolve(parse_xiph(body));
        });
    });
}
exports.search_xiph = search_xiph;
/**
 * @method search_shoutcast
 * @description Search the shoutcast directory
 * @param search Non-formatted query
 * @return Stream list promise
 **/
function search_shoutcast(search) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: 'https://directory.shoutcast.com/Search/UpdateSearch',
            form: {
                query: search.split(' ').join('+')
            }
        };
        require('request')(options, (err, _, body) => {
            if (err)
                reject(err);
            const json = JSON.parse(body);
            resolve(parse_shoutcast(json));
        });
    });
}
exports.search_shoutcast = search_shoutcast;
function parse_xiph(body) {
    const host = 'http://dir.xiph.org';
    const playing_pos = 25;
    const document = new jsdom_1.JSDOM(body).window.document;
    const rows = document.querySelector('body > #thepage > #content > .servers-list :nth-child(1)');
    if (rows === null)
        return [];
    else
        return Array.from(rows.children).map((entry) => {
            const sel_name_hp = entry.querySelector('.description > .stream-name > .name > a');
            const sel_listeners = entry.querySelector('.description > .stream-name > .listeners');
            const sel_description = entry.querySelector('.description > .stream-description');
            const sel_playing = entry.querySelector('.description > .stream-onair');
            const sel_url = entry.querySelector('.tune-in > .format ~ p :nth-child(1)');
            return {
                name: sel_name_hp ? sel_name_hp.innerHTML : 'Null',
                homepage: sel_name_hp ? sel_name_hp.href : 'Null',
                listeners: sel_listeners ? sel_listeners.innerHTML.split('&nbsp')[0].substr(1) : 'Null',
                description: sel_description ? sel_description.innerHTML : '',
                playing: sel_playing ? sel_playing.innerHTML.substr(playing_pos) : '',
                url: sel_url ? host + sel_url.href : 'Null',
                src: 'Icecast',
                is_playlist: true
            };
        });
}
function parse_shoutcast(json) {
    return Object.keys(json).map(key => ({
        name: json[key].Name,
        homepage: '',
        listeners: json[key].Listeners.toString(),
        description: '',
        playing: json[key].CurrentTrack,
        url: `http://yp.shoutcast.com/sbin/tunein-station.m3u?id=${json[key].ID}`,
        src: 'Shoutcast',
        is_playlist: true
    }));
}
