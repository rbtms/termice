/**
* Query and parse Icecast and Shoutcast directories
* @module Icecast
**/
import Request from 'request';


/**
* @method search_xiph
* @description Search the xiph icecast directory
* @param search Non-formatted query
* @return Stream list promise
**/
export function search_xiph(search :string) :Promise<IcecastEntry[]> {
    return new Promise( (resolve, reject) => {
        
        const options = {
            method : 'GET',
            url    : 'http://dir.xiph.org/search?search=' + search.split(' ').join('+')
        };
        
        Request(options, (err :string, _, body :string) => {
            if(err) reject(err);
            
            resolve( parse_xiph(body) );
        });
    
    });
}

/**
* @method search_shoutcast
* @description Search the shoutcast directory
* @param search Non-formatted query
* @return Stream list promise
**/
export function search_shoutcast(search :string) :Promise<IcecastEntry[]> {
    return new Promise( (resolve, reject) => {
    
        const options = {
            method   : 'POST',
            url      : 'https://www.shoutcast.com/Search/UpdateSearch',
            formData : {
                query: search.split(' ').join('+')
            }
        };
        
        Request(options, (err :string, _, body :string) => {
            if(err) reject(err);
            
            const json = JSON.parse(body);
            resolve( parse_shoutcast(json) );
        });
    
    });
}


function parse_xiph(body :string) :IcecastEntry[] {
    const host = 'http://dir.xiph.org';
    
    const rows = body.replace(/\n/g, '')
        .match(/<tr class="row\d+?">.+?<\/tr>/g);
    
    switch(rows === null) {
        case true : return [];
        default   : return rows.map( (entry) => {
            let match = entry.match(/<span class="name"><a href="(.+?)" onclick=".+?">(.+?)<\/a>/);
            if(match === null) return false;
            
            let [, homepage, name] = match;
            
            let m_listeners   = entry.match(/<span class="listeners">\[(\d+).+?<\/span>/);
            let m_description = entry.match(/<p class="stream-description">(.+?)<\/p>/);
            let m_playing     = entry.match(/<p class="stream-onair"><.+?>.+?<\/.+?>(.+?)<\/p>/);
            let m_url         = entry.match(/.+<a href="(.+?\.m3u)"/);
            
            
            const listeners   = m_listeners   === null ? 'Null' : m_listeners[1];
            const description = m_description === null ? ''     : m_description[1];
            const playing     = m_playing     === null ? ''     : m_playing[1];
            const url         = m_url         === null ? 'Null' : host + m_url[1];
            
            
            return {
                name        : name.trim(),
                homepage    : homepage.trim(),
                listeners   : listeners.trim(),
                description : description.trim(),
                playing     : playing.trim(),
                url         : url.trim(),
                src         : 'Icecast',
                is_playlist : true
            };
        }).filter( (entry) => entry !== false );
    }
}

function parse_shoutcast(json :AnyJSON) :IcecastEntry[] {
    return Object.keys(json).map( (key) => ({
        name        : json[key].Name,
        homepage    : '',
        listeners   : json[key].Listeners.toString(),
        description : '',
        playing     : json[key].CurrentTrack,
        url         : `http://yp.shoutcast.com/sbin/tunein-station.m3u?id=${json[key].ID}`,
        src         : 'Shoutcast',
        is_playlist : true
    }));
}
