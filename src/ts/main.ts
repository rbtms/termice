/**
 * @fileOverview main.ts
 * @author       Alvaro Fernandez {@link https://github.com/robotoms}
 * @version      1.0.0
 * @description  Simple terminal icecast player
 * @license
 * Copyright (c) 2019 Alvaro Fernandez
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
 * ERROR
 * @todo Remove layout-breaking characters
 * @todo Scroll up near the first entry makes cursor to disappear
 * @todo Invalid source arguments break the program on startup
 *
 * TODO
 * @todo Log errors
 * @todo Test file
 * @todo Add mplayer to deb dependencies
 * @todo Volume bar
 * @todo Add option to add non-selectable descriptions
 * @todo Improve performance on large lists
 *
 * IDEAS
 * @todo Update currently playing track information
 * @todo Add currently playing bar
 * @todo Add free music sources
  **/
import Minimist       from 'minimist';

import * as Util      from './lib/util';
import * as Icecast   from './lib/icecast';
import * as Shoutcast from './lib/shoutcast';
import * as Radio     from './lib/radio';
// ~20ms startup time
import Mplayer        from './lib/mplayer';

import { State, Config, Entry } from './lib/interfaces';

/**
 * TODO: Remove this function in favor of quit
 * @description Destroy the interface and force exit the program (debug)
 * @param s State
 * @param smth Anything to print
 **/
async function force_quit(s :State, smth :any) :Promise<void> {
  await Mplayer.quit();

  s.scr.destroy();
  console.log(smth);

  throw Error('Force exit');
  process.exit();
}

/**
 * @description Print usage and exit
 **/
function print_usage_and_quit() :void {
  console.log(`
Usage: termice [ARGS]

Options
  -h: Show this help
  -q: Query
  -s: Source [Icecast | Shoutcast | Radio]

Commands [:command | query]
   q : Quit

Sources
   Icecast   : https://dir.xiph.org
   Shoutcast : https://directory.shoutcast.com
   Radio     : http://www.radio-browser.info
     This source also allows to filter results
     by name, tag, country or language, which can
     be achieved by querying for filter:query
`);

  process.exit();
}

/**
 * @description Stop the player and exit
 * @param s State
 * @param line Exit line
 **/
async function quit(s :State, line = '') :Promise<void> {
  await Mplayer.quit();
  
  // Exit interface
  s.scr.destroy();

  // Print exit line if there is one
  if(line)
    throw Error(line);

  process.exit();
}

/**
 * @description Set state flags
 * @param s State
 * @param flags Flags to set
 **/
function set_flags(s :State, flags :any) :State {
  const _flags = Object.assign( Object.assign({}, s.flags), flags);

  return Object.freeze({
    scr         : s.scr,
    comp        : s.comp,
    config      : s.config,
    stream_list : s.stream_list,
    flags       : Object.freeze(_flags)
  });
}

/**
 * @description Set state stream list
 * @param s State
 * @param list Stream list
 **/
function set_stream_list(s :State, list :Entry[]) :State {
  return Object.freeze({
    scr         : s.scr,
    comp        : s.comp,
    config      : s.config,
    stream_list : list.slice(),
    flags       : s.flags
  });
}

/**
 * @description Stop the player
 * @param s State
 **/
async function stop(s :State) :Promise<State> {
  const s2 = set_flags(s, {
    is_paused  : false
  });

  await Mplayer.stop();
  set_header(s2);

  return s2;
}

/**
 * @description Pause/Resume the player
 * @param s State
 **/
async function pause(s :State) :Promise<State> {
  if( Mplayer.is_init ) {
    const s2 = set_flags(s, { is_paused: !s.flags.is_paused });

    await Mplayer.pause();
  
    // Update pause key text
    set_header(s2);
  
    return s2;
  }
  else {
    return s;
  }
}

/**
 * @description Play a url with mplayer
 * @param s State
 * @param entry Stream entry
 **/
async function play_url(s :State, entry :Entry) :Promise<State> {
  try {
    const s2 = set_flags(s, { is_paused : false });

    await Mplayer.play(entry.url, entry.is_playlist);

    set_header(s2);
    render(s2);

    return s2;
  }
  catch(err) {
    force_quit(s, err);
    // TODO: Mock return
    return s;
  }
}

/**
 * @description Set current tab in the header
 * @param s State
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
 * @description Display <rows> in stream_table
 * @param s State
 * @param rows Array of formatted rows
 **/
function set_rows(s :State, rows :string[][]) :void {
  s.comp.stream_table.setData(rows);
}

/**
 * @description Get query function
 * @param s State
 * @param search Search query
 **/
function query_streams(s :State, search :string) : Promise<Entry[]> {
  switch(s.flags.source) {
    case 'Icecast': {
      return Icecast.search_xiph(search);
    }
    case 'Shoutcast': {
      return Shoutcast.search_shoutcast(search);
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
            return Radio.search_radio(subsearch, mode);
          }
          // It isn't a valid mode
          default: {
            return new Promise( (resolve) => {
              resolve([Util.error_entry(
                'Not a valid mode: ' + mode,
                s.flags.source
              )]);
            })
          }
        }
      }
      // There is not a match
      else {
        return Radio.search_radio(search, 'name');
      }
    }
    default: {
      force_quit(s, 'Not a valid source: ' + s.flags.source);
      return query_streams(s, s.flags.last_search);
    }
  }
}

/**
 * @description Query source and display results
 * @param s State
 * @param search Unformatted query string
 **/
async function search_streams(s :State, search :string) :Promise<State> {
  s.comp.loading.load('Searching: ' + search);

  // Update flags
  const s2 = set_flags(s, {
    last_search   : search,
    last_tab      : s.flags.source
  });

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

  // TODO: Show an error message on error
  if(rows !== false) {
    set_rows(s3, rows);
    s3.comp.loading.stop();

    set_header(s3);
    render(s3);
  }

  return s3;
}

/**
 * @description Refresh table with last query
 * @param s State
 **/
async function refresh_table(s :State) :Promise<State> {
  return await search_streams(s, s.flags.last_search);
}

function show_input(s :State) :State {
  const s2 = set_flags(s, { last_tab: 'Search' });

  s2.comp.input.show();
  //s2.comp.input.input();
  s2.comp.input.focus();

  set_header(s2);

  return s2;
}

function hide_input(s :State) :State {
  const s2 = set_flags(s, { last_tab: s.flags.source });

  s2.comp.input.hide();
  s2.comp.stream_table.focus();
  set_header(s2);
  render(s2);

  return s2;
}

/**
 * @description Handle raw input lines
 * @param s State
 * @param line Input line
 **/
async function input_handler(s :State, line :string) :Promise<State> {
  // Command
  if(line === ':q') {
    await quit(s);
    return s;
  }
  // Query
  else {
    s.comp.input.clearValue();
    const s2 = hide_input(s);

    if(line !== '') {
      return await search_streams(s2, line);
    }
    else {
      return s;
    }
  }
}

/**
 * @description Render screen
 */
function render(s :State) :void {
  s.scr.render();
}

/**
 * @description Remove events in order to set them to the next state
 * @param s State
 */
function remove_events(s: State) :void {
  s.scr.unkey( s.config.keys.screen.quit     );
  s.scr.unkey( s.config.keys.screen.pause    );
  s.scr.unkey( s.config.keys.screen.stop     );
  s.scr.unkey( s.config.keys.screen.vol_up   );
  s.scr.unkey( s.config.keys.screen.vol_down );
  s.scr.unkey( s.config.keys.screen.input    );

  s.scr.unkey( s.config.keys.screen.icecast   ); 
  s.scr.unkey( s.config.keys.screen.shoutcast );
  s.scr.unkey( s.config.keys.screen.radio     );
  s.scr.unkey( s.config.keys.screen.refresh   );

  s.comp.stream_table.unkey( s.config.keys.screen.input             );
  s.comp.stream_table.unkey( s.config.keys.stream_table.debug       );
  s.comp.stream_table.unkey( s.config.keys.stream_table.scroll_down );
  s.comp.stream_table.unkey( s.config.keys.stream_table.scroll_up   );

  s.comp.input.unkey( s.config.keys.screen.input );
  s.comp.input.unkey( s.config.keys.input.submit );

  delete s.comp.stream_table._events.select;
}

/**
 * @description Set blessed events
 * @param s State
 **/
function set_events(s :State) :void {
  remove_events(s);

  /*
   * Screen events
   */

  s.scr.onceKey(s.config.keys.screen.quit, () =>
    quit(s)
  );

  // Mplayer
  s.scr.onceKey(s.config.keys.screen.pause, async () => {
    s.comp.loading.load('Pausing');
    const s2 = await pause(s);
    s.comp.loading.stop();

    render(s);
    set_events(s2);
  });
  s.scr.onceKey(s.config.keys.screen.stop, async () => {
    s.comp.loading.load('Stopping');
    const s2 = await stop(s);
    s.comp.loading.stop();

    render(s2);
    set_events(s2);
  });
  s.scr.key( s.config.keys.screen.vol_up, () =>
    Mplayer.volume('+1')
  );
  s.scr.key( s.config.keys.screen.vol_down, () =>
    Mplayer.volume('-1')
  );

  /*
   * Stream table events
   */

  // Icecast tab
  s.scr.onceKey( s.config.keys.screen.icecast, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Icecast'}) );
    set_events(s2);
  });

  // Shoutcast tab
  s.scr.onceKey( s.config.keys.screen.shoutcast, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Shoutcast'}) );
    set_events(s2);
  });

  // Radio tab
  s.scr.onceKey( s.config.keys.screen.radio, async () => {
    const s2 = await refresh_table( set_flags(s, {source: 'Radio'}) );
    set_events(s2);
  });

  // Refresh table
  s.scr.onceKey( s.config.keys.screen.refresh, async () => {
    const s2 = await refresh_table(s);
    set_events(s2);
  });

  // Enter
  s.comp.stream_table.on('select', async (_ :any, i :number) => {
    const entry :Entry = s.stream_list[i-1];
    const s2 = await play_url(s, entry);
    set_events(s2);
  });

  // Input toggle
  s.comp.stream_table.onceKey(s.config.keys.screen.input, async () => {
    const s2 = show_input(s);
    render(s2);
    set_events(s2);
  });

  // Print entry to debug
  s.comp.stream_table.key(s.config.keys.stream_table.debug, () => {
    const offset = s.comp.stream_table.childOffset;
    s.scr.debug( s.stream_list[offset-1].entry );
  });

  // Skip 10 entries down
  s.comp.stream_table.key(s.config.keys.stream_table.scroll_down, () => {
    s.comp.stream_table.down(s.config.scroll_up_dist);
    render(s);
  });
  // Skip 10 entries up
  s.comp.stream_table.key(s.config.keys.stream_table.scroll_up, () => {
    s.comp.stream_table.up(s.config.scroll_down_dist);
    render(s);
  });

  /*
   * Input form events
   */

  // Query submit
  s.comp.input.onceKey(s.config.keys.input.submit, async () => {
    const line :string = s.comp.input.getText().trim();
    const s2 = await input_handler(s, line);
    set_events(s2);
  });

  // Input toggle
  s.comp.input.onceKey(s.config.keys.screen.input, async () => {
    const s2 = hide_input(s);
    set_events(s2);
  });

  s.comp.loading.onceKey('q', () => quit(s));
}

/**
 * @description Initialize
 * @param s State
 */
async function init(s :State) :Promise<void> {
  // TODO: Have a look at this render (100ms startup time)
  set_header(s);
  render(s);

  const s2 = await search_streams(s, s.flags.last_search);
  set_events(s2);
}

/**
 * @description Initialize program state
 * @param config Configuration file
 * @param argv Command line arguments
 */
function init_state(config :Config, argv :any, styles :any) :State {
  // Declare here in order to reduce startup time by 50ms or so
  const Blessed = require('blessed');

  const scr = Blessed.screen({
    autoPadding : true,
    debug       : true,
    fullUnicode : true,
    //forceUnicode: true,
    smartCSR    : true,
    //warnings: true
  });

  // Set initial header
  styles.header.content = Util.format_init_header(config.header);

  // Blessed components
  const comp = {
    header       : Blessed.listbar  (styles.header),
    stream_table : Blessed.listtable(styles.stream_table),
    input        : Blessed.textarea (styles.input),
    loading      : Blessed.loading  (styles.loading)
  };

  scr.append(comp.header);
  scr.append(comp.stream_table);
  scr.append(comp.input);
  scr.append(comp.loading);

  comp.stream_table.focus();

  return Object.freeze({
    scr,
    comp,
    config,
    stream_list : [],
    flags: Object.freeze({
      last_search   : argv.q || config.default_search,
      last_tab      : argv.s || config.default_source,
      source        : argv.s || config.default_source,
      is_paused     : false
    })
  });
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
    print_usage_and_quit();
  else {
    const config = Util.read_config();
    const styles = Util.read_styles();
    const s      = init_state(config, argv, styles);

    init(s);
  }
}

main();

