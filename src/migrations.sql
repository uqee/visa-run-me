-- clean

  drop table cars;
  drop table countries;
  drop table feedbacks;
  drop table needs;
  drop table persons;
  drop table places;
  drop table sessions;
  drop table trips;
  drop table tripCars;
  drop table tripPersons;
  drop table tripPlaces;

  commit;

-- tables

  create table cars (
    id string,

    personId string,

    capacity uint8,
    model utf8,

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table countries (
    id string,

    name utf8,

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table feedbacks (
    id string,

    personId string,
    tripId string,

    stars uint8,

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table needs (
    id string,

    personId string,
    placeId string,
    tripId string,

    departure uint32,
    price uint8,
    status uint8, -- Todo | Arranged | Canceled | Done

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table persons (
    id string,

    _feedbacksCount uint32,
    _feedbacksSum uint32,
    _tripsCount uint32,
    tgid string,
    tgfullname utf8,
    tgusername string,

    created uint32,
    updated uint32,
    index persons_tgid_idx global on (tgid),
    primary key (id)
  );

  create table places (
    id string,

    countryId string,

    name utf8,

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table sessions (
    key string,
    value string,
    created uint32,
    primary key (key)
  );

  create table trips (
    id string,

    capacityMax uint8,
    capacityMin uint8,
    name utf8,
    status uint8, -- Todo | Arranged | Canceled | Done

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table tripCars (
    id string,

    carId string,
    tripId string,

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table tripPersons (
    id string,

    personId string,
    tripId string,

    role uint8, -- Driver | Passenger

    created uint32,
    updated uint32,
    primary key (id)
  );

  create table tripPlaces (
    id string,

    placeId string,
    tripId string,

    agenda utf8,
    arrival uint32,
    duration uint32,
    price uint8,

    created uint32,
    updated uint32,
    primary key (id)
  );

  commit;

-- fill

  replace into countries
    (id, name, created, updated)
  values
    ('hbcco3hgy73', 'Albania',              1650900000, 1650900000),
    ('wugw29mxv1w', 'Bosnia i Herzegovina', 1650900000, 1650900000),
    ('8jnteunp9pl', 'Croatia',              1650900000, 1650900000),
    ('ifippr1zzqt', 'Montenegro',           1650900000, 1650900000),
    ('jyqfnqjm3xq', 'Serbia',               1650900000, 1650900000);

  replace into places
    (id, countryId, name, created, updated)
  values
    ('nkstbktengu', 'hbcco3hgy73', 'Bashkimi',     1650900000, 1650900000),
    ('lxt7ulyiw4i', 'hbcco3hgy73', 'Koplik',       1650900000, 1650900000),
    ('6wom34y1tie', 'hbcco3hgy73', 'Shkodër',      1650900000, 1650900000),

    ('s1rwfm263u7', 'wugw29mxv1w', 'Bileća',       1650900000, 1650900000),
    ('to7nyp5fcng', 'wugw29mxv1w', 'Gacko',        1650900000, 1650900000),
    ('jq6yo1m65uc', 'wugw29mxv1w', 'Goražde',      1650900000, 1650900000),
    ('7aku8bdzz9y', 'wugw29mxv1w', 'Trebinje',     1650900000, 1650900000),

    ('jh6cq0gf4hr', '8jnteunp9pl', 'Dubrovnik',    1650900000, 1650900000),

    ('no5va8kiiq0', 'ifippr1zzqt', 'Bar',          1650900000, 1650900000),
    ('sdu4cz2s6w4', 'ifippr1zzqt', 'Berane',       1650900000, 1650900000),
    ('vvajmv2kn7s', 'ifippr1zzqt', 'Bijelo Polje', 1650900000, 1650900000),
    ('aonbpsekpi1', 'ifippr1zzqt', 'Budva',        1650900000, 1650900000),
    ('sor8du5ww88', 'ifippr1zzqt', 'Cetinje',      1650900000, 1650900000),
    ('w87ms7tlgt1', 'ifippr1zzqt', 'Herceg Novi',  1650900000, 1650900000),
    ('49ap5tab5vl', 'ifippr1zzqt', 'Kotor',        1650900000, 1650900000),
    ('x06f2x4vw5g', 'ifippr1zzqt', 'Nikšić',       1650900000, 1650900000),
    ('ojhzb7hrmci', 'ifippr1zzqt', 'Petrovac',     1650900000, 1650900000),
    ('by4lcxa24qn', 'ifippr1zzqt', 'Pljevlja',     1650900000, 1650900000),
    ('omkz5u9ssz2', 'ifippr1zzqt', 'Podgorica',    1650900000, 1650900000),
    ('0ann5o0onrz', 'ifippr1zzqt', 'Rožaje',       1650900000, 1650900000),
    ('i27gd9iql29', 'ifippr1zzqt', 'Sitnica',      1650900000, 1650900000),
    ('s2zpnylzn5x', 'ifippr1zzqt', 'Tivat',        1650900000, 1650900000),
    ('d3lvr56s0o8', 'ifippr1zzqt', 'Ulcinj',       1650900000, 1650900000),

    ('nyt1lvyamwh', 'jyqfnqjm3xq', 'Gostun',       1650900000, 1650900000),
    ('ron3dvdly4n', 'jyqfnqjm3xq', 'Jabuka',       1650900000, 1650900000),
    ('woabq2ttqgq', 'jyqfnqjm3xq', 'Krnjača',      1650900000, 1650900000),
    ('83kfaps9nu5', 'jyqfnqjm3xq', 'Ribariće',     1650900000, 1650900000);

  commit;

--

  -- id: string, uuid
  -- timestamp: uint32, precision 1 second

  -- select * from countries;
  -- insert into countries (id, name, updated) values (1650900000005, 'Kosovo', 1650900000005);
  -- delete from countries where id == 5;
