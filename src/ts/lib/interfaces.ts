export interface State {
  scr         :any; //Blessed.Screen,
  comp        :any;
  config      :Config;
  stream_list :Entry[];
  flags       :Flags;
}

export interface Config {
  [propName :string] :any;
}

export interface Flags {
  last_search   :string;
  last_tab      :string;
  source        :string;
  current_index :number;
  is_playing    :boolean;
  is_paused     :boolean;
}

export interface Entry {
  name         :string;
  homepage     :string;
  listeners    :string;
  description  :string;
  playing      :string;
  url          :string;
  src          :string;
  bitrate      :string;
  is_playlist  :boolean;
  entry        :any;
}

export interface StringJSON {
  [propName :string] :string;
}

export interface AnyJSON {
  [propName :string] :any;
}

