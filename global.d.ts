interface StringJSON {
    [propName :string] :string;
}

interface AnyJSON {
    [propName :string] :any;
}

interface Entry {
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

interface IcecastEntry {
    name        :string;
    homepage    :string;
    listeners   :string;
    description :string;
    playing     :string;
    url         :string;
    src         :string;
    is_playlist :boolean;
}

interface RadioEntry {
    name        :string;
    homepage    :string;
    url         :string;
    src         :string;
    bitrate     :string;
    is_playlist :boolean;
}