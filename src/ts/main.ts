/**
 * @fileOverview main.js
 * @author      nishinishi9999 (Alvaro Fernandez) {@link https://github.com/nishinishi9999}
 * @version     0.1.0
 * @description Simple terminal net stream player
 * @license
 * Copyright (c) 2018 Alvaro Fernandez
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see {@link https://www.gnu.org/licenses/}.
 *
 *
 * TESTING
 * @todo Go to the last index when pressing up in the first index
 * @todo Fix set_title inside set_header
 *
 * IN PROGRESS
 * @todo Catch errors
 * @todo Test file
 *
 * ERROR
 * @todo Cache loop errors
 * @todo Remove layout-breaking characters
 *
 * TODO
 * @todo Reduce startup and quit overhead
 * @todo Check whether mplayer is installed
 * @todo Volume bar
 **/
import * as Blessed from 'blessed';
import Minimist     from 'minimist';

import * as Util    from './lib/util';
import * as Icecast from './lib/icecast';
import * as Radio   from './lib/radio';
import * as Style   from './lib/style';
import Mplayer      from './lib/mplayer';

import { State, Config, Entry } from './lib/interfaces';


/**
 * TODO
 *
 * Update currently playing track information
 * Add currently playing bar
 * Update frequently
 *
 * Add podcasts
 * Add free music sources
 **/
function force_exit(s :any, smth :any) :void {
  s.scr.destroy();
  console.log(smth);

  throw 'Force exit';
  process.exit();
}

// Usage
function print_usage_and_exit() :void {
  console.log(`
Usage: netstreams [ARGS]

Options:
  -h: Show this help
  -q: Query
  -s: Source [Icecast | Shoutcast | Radio]
`);

  process.exit();
}

/**
 * @description Stop the player and exit
 **/
async function exit(s :State, line? :string) :Promise<void> {
  await Mplayer.quit();
  
  // Exit interface
  s.scr.destroy();

  // Print exit line if there is one
  if(line)
    throw Error(line);

  process.exit();
}

/**
 * @description Stop the player
 **/
async function stop(s :State) :Promise<State> {
  await Mplayer.stop();

  const s2 = set_flags(s, { is_playing: !s.flags.is_playing});

  // Update title
  set_title(s2);

  return s2;
}

function set_flags(s :State, flags :any) :State {
  const _flags = Object.assign( Object.assign({}, s.flags), flags);

  return {
    scr         : s.scr,
    comp        : s.comp,
    config      : s.config,
    stream_list : s.stream_list.slice(),
    flags       : _flags
  };
}

function set_stream_list(s :State, list :Entry[]) :State {
  return {
    scr         : s.scr,
    comp        : s.comp,
    config      : s.config,
    stream_list : list.slice(),
    flags       : s.flags
  };
}

/**
 * @description Pause/Resume the player
 **/
async function pause(s :State) :Promise<State> {
  await Mplayer.pause();

  // Update pause key text
  // Renders screen
  set_header_title(s);

  return set_flags(s, { is_paused: !s.flags.is_paused });
}

/**
 * @description Play a url with mplayer
 * @param entry Table entry
 **/
async function play_url(s :State, entry :Entry) :Promise<State> {
  try {
    await Mplayer.play(entry.url, entry.is_playlist);

    const s2 = set_flags(s, {
      is_playing : false,
      is_paused  : false
    });

    // Renders screen
    set_header_title(s2, entry.name);

    return set_flags(s2, { is_playing: true });
  }
  catch(err) {
    force_exit(s, err);
    // TODO: Mock
    return s;
  }
}

/**
 * @description Set current tab in the header
 * @param tab Current tab
 **/
function set_header(s :State) :void {
  const line = Util.format_header(
    s.flags.last_tab,
    s.config.header,
    s.config.pause_key,
    s.flags.is_paused
  );

  s.comp.header.setContent(line);
}

/**
 * @description Set window title
 * @param src  Current source
 * @param name Entry name
 **/
function set_title(s :State, stream_name? :string) :void {
  // Keep the old title if it's playing
  if(!s.flags.is_playing)
    s.scr.title = stream_name === undefined
      ? Util.format_title(s, '')
      : Util.format_title(s, stream_name);
}

function set_header_title(s: State, stream_name? :string) :void {
  set_header(s);
  set_title(s, stream_name);

  s.scr.render();
}

/**
 * @description Display <rows> in stream_table
 * @param Array of formatted rows
 **/
function set_rows(s :State, rows :string[][]) :void {
  s.comp.stream_table.setData(rows);
}

/**
 * @description Get query function
 * @param search Search query
 * @param src    Stream source
 * @return Query function
 **/
function query_streams(s :State, search :string) : Promise<Entry[]> {
  switch(s.flags.source) {
    case 'Icecast': {
      return Icecast.search_xiph(search);
    }
    case 'Shoutcast': {
      return Icecast.search_shoutcast(search);
    }
    case 'Radio': {
      // Parse mode
      const has_mode :boolean = search.includes(':');

      // There is a match
      if (has_mode) {
        const [mode, subsearch] = search.split(':');

        switch(mode) {
          // It's a valid mode
          case 'name':
          case 'tag':
          case 'country':
          case 'language': {
            return Radio.search_radio(mode, subsearch);
          }
            // It isn't a valid mode
          default: {
            return query_streams(s, s.flags.last_search);
          }
        }
      }
      // There is not a match
      else {
        return Radio.search_radio(search, 'name');
      }
    }
    default: {
      //await exit(s, 'Not a valid source: ' + s.flags.source);
      process.exit();
      return query_streams(s, s.flags.last_search);
    }
  }
}

/**
 * @description Query source and display results
 * @param search Unformatted query string
 * @param src    Streams source
 **/
async function search_streams(s :State, search :string) :Promise<State> {
  s.comp.loading.load('Searching: ' + search);

  // Update flags
  const s2 = set_flags(s, {
    last_search   : search,
    last_tab      : s.flags.source,
    current_index : 0
  })

  const list :Entry[] = await query_streams(s2, search);

  // Update current stream list for events
  const s3 = set_stream_list(s2, list);

  // Process the list and display it
  const rows = Util.format_stream_list(
    s3,
    list,
    s3.config.table_headers[s3.flags.source],
    search
  );

  //// Show an error message on false
  if(rows !== false) {
    set_rows(s3, rows);
    s3.comp.loading.stop();

    // Renders screen
    set_header_title(s3);
  }

  return s3;
}

/**
 * @description Refresh table with last query
 **/
async function refresh_table(s :State) :Promise<State> {
  return await search_streams(s, s.flags.last_search);
}

/**
 * @description Toggle the input textarea
 **/
function toggle_input(s :State) :State {
  const tab = s.flags.is_input ? s.flags.source : 'Search';
  const s2  = set_flags(s, { last_tab: tab, is_input: !s.flags.is_input });

  // Toggle input
  //s2.comp.input.toggle();

  
  // Enable input
  if(s2.flags.is_input) {
    s2.comp.input.show();
    s2.comp.input.input();

    // Renders

    //s2.comp.input.input();
  }
  else {
    s2.comp.input.hide();
    //s2.comp.input.hide();
    //s2.comp.stream_table.focus();

    //s2.comp.input.render();
    //s2.comp.input.cancel()
  }

  set_header_title(s2);

  return s2;
}

async function input_handler(s :State, line :string) :Promise<State> {
  // Command
  if(line === ':q') {
    await exit(s);
    return s;
  }
  // Query
  else {
    s.comp.input.clearValue();

    const s2 = await search_streams(s, line);
    return toggle_input(s2);
  }
}

/**
 * @description Set events
 **/
function set_events(s :State) :void {
  // Screen events
  s.scr.key( [ s.config.keys.screen.quit     ], () => exit(s)  ); // Discard arguments
  s.scr.key( [ s.config.keys.screen.pause    ], async () => {
    const s2 = await pause(s);
    set_events(s2);
  });
  s.scr.key( [ s.config.keys.screen.stop     ], async () => {
    const s2 = await stop(s);
    set_events(s2);
  });
  s.scr.key( [ s.config.keys.screen.vol_up   ], () => Mplayer.volume('+1') );
  s.scr.key( [ s.config.keys.screen.vol_down ], () => Mplayer.volume('-1') );
  s.scr.key( [ s.config.keys.screen.input    ], async () => {
    const s2 = await toggle_input(s);
    set_events(s2);
  });

  // Icecast tab
  s.scr.key( s.config.keys.screen.icecast, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Icecast'}) );
    set_events(s2);
  });

  // Shoutcast tab
  s.scr.key( s.config.keys.screen.shoutcast, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Shoutcast'}) );
    set_events(s2);
  });

  // Radio tab
  s.scr.key( s.config.keys.screen.radio, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Radio'}) );
    set_events(s2);
  });

  // Refresh table
  s.scr.key( s.config.keys.screen.refresh, async () => {
    const s2 = await refresh_table(s);
    set_events(s2);
  });

  // Stream table events
  s.comp.stream_table.on('select', async (_ :any, i :number) => {
    const entry :Entry = s.stream_list[i-1];
    //force_exit(s, entry);

    const s2 = await play_url(s, entry);
    set_events(s2);
  });

  // Input form events
  s.comp.input.key('enter', async () => {
    const line :string = s.comp.input.getText().trim();
    const s2 = await input_handler(s, line);

    set_events(s2);
  });
}

async function init(s :State) :Promise<void> {
  set_events(s);
  s.scr.render();

  const s2 = await search_streams(s, s.flags.last_search);
  set_events(s2);
}

function init_state(config :Config, argv :any) :State {
  const scr = Blessed.screen({
    autoPadding : true,
    debug       : false,
    fullUnicode : true,
    //forceUnicode: true,
    smartCSR    : true,
    //warnings: true
  });

  // Blessed components
  const comp = {
    header       : Blessed.listbar  (Style.style.header),
    stream_table : Blessed.listtable(Style.style.stream_table),
    input        : Blessed.textarea (Style.style.input),
    loading      : Blessed.loading  (Style.style.loading)
  };

  scr.append(comp.header);
  scr.append(comp.stream_table);
  scr.append(comp.input);
  scr.append(comp.loading);

  comp.stream_table.focus();

  return {
    scr,
    comp,
    config,
    stream_list : [],
    flags: {
      last_search   : argv.q || config.default_search,
      last_tab      : argv.s || config.default_source,
      source        : argv.s || config.default_source,
      current_index : 0,
      is_playing    : false,
      is_paused     : false,
      is_input      : false
    }
  }
}

/**
 * @description Main
 **/
function main() :void {
  const available_opts = ['h', 'q', 's', '_'];
  const argv = Minimist(process.argv);

  if(
    argv.h
    || !!Object.keys(argv).find( (opt :string) => !available_opts.includes(opt) )
  )
    print_usage_and_exit();
  else {
    const config = Util.read_config();
    const s      = init_state(config, argv);

    init(s);
  }
}

main();

