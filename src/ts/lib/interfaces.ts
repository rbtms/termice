export interface StringJSON {
  [propName :string] :string;
}

export interface AnyJSON {
  [propName :string] :any;
}

export interface Entry {
  name         :string;
  homepage?    :string;
  listeners?   :string;
  description? :string;
  playing?     :string;
  url          :string;
  src          :string;
  bitrate?     :string;
  is_playlist  :boolean;
}

export interface IcecastEntry {
  name        :string;
  homepage    :string;
  listeners   :string;
  description :string;
  playing     :string;
  url         :string;
  src         :string;
  is_playlist :boolean;
}

export interface RadioEntry {
  name        :string;
  homepage    :string;
  url         :string;
  src         :string;
  bitrate     :string;
  is_playlist :boolean;
}

