drop table _caches;
drop table cars;
drop table countries;
drop table feedbacks;
drop table needs;
drop table persons;
drop table places;
drop table trips;
drop table tripCars;
drop table tripPersons;
drop table tripPlaces;

commit;

--

create table _caches (
  key string,
  value string,

  created uint32,
  primary key (key)
);

create table cars (
  capacity uint8,
  model utf8,
  personId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table countries (
  name utf8,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table feedbacks (
  personId string,
  stars uint8,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table needs (
  departure uint32,
  personId string,
  placeId string,
  price uint8,
  status uint8,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table persons (
  _feedbacksCount uint32,
  _feedbacksSum uint32,
  _tripsCount uint32,
  firstname utf8,
  lastname utf8,
  userid string,
  username string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  index persons_tgid_idx global on (tgid),
  primary key (id)
);

create table places (
  countryId string,
  name utf8,
  status uint8,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table trips (
  capacityMax uint8,
  capacityMin uint8,
  name utf8,
  start uint32,
  status uint8,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table tripCars (
  carId string,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table tripPersons (
  personId string,
  role uint8,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

create table tripPlaces (
  agenda utf8,
  arrival uint32,
  duration uint32,
  placeId string,
  price uint8,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  ownerId string,
  primary key (id)
);

commit;

--

replace into persons
  (_feedbacksCount, _feedbacksSum, _tripsCount, firstname, lastname, userid, username, created, deleted, id, ownerId)
values
  (0, 0, 0, 'Denis', 'Zhbankov', '115469675', 'denis_zhbankov', 1650900000, null, '4e583a933d9', '4e583a933d9')

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
