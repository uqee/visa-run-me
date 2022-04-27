drop table caches;
drop table cars;
drop table countries;
drop table feedbacks;
drop table needs;
drop table persons;
drop table places;
drop table trips;
drop table tripPlaces;

commit;

--

create table caches (
  key string,
  value string,

  created uint32,
  primary key (key)
);

create table cars (
  _feedbacksCount uint32,
  _feedbacksSum uint32,
  capacity uint8,
  name utf8,
  personId string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index cars_tgid_idx global on (tgid),
  primary key (id)
);

create table countries (
  name utf8,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index countries_tgid_idx global on (tgid),
  primary key (id)
);

create table feedbacks (
  personId string, -- from
  stars uint8,
  tripId string, -- to

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index feedbacks_tgid_idx global on (tgid),
  primary key (id)
);

create table needs (
  deadline uint32,
  personId string,
  placeId string,
  price uint8,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index needs_tgid_idx global on (tgid),
  primary key (id)
);

create table persons (
  _feedbacksCount uint32,
  _feedbacksSum uint32,
  firstname utf8,
  lastname utf8,
  -- tgid string,
  tgname string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index persons_tgid_idx global on (tgid),
  primary key (id)
);

create table places (
  countryId string,
  name utf8,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index places_tgid_idx global on (tgid),
  primary key (id)
);

create table trips (
  capacityMax uint8,
  capacityMin uint8,
  carId string,
  name utf8,
  day uint32,
  personId string,
  status uint8, -- offered | confirmed | finished

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index trips_tgid_idx global on (tgid),
  primary key (id)
);

create table tripPlaces (
  agenda utf8,
  placeId string,
  price uint8,
  time uint32,
  tripId string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index tripPlaces_tgid_idx global on (tgid),
  primary key (id)
);

commit;

--

delete from countries;
delete from persons;
delete from places;

commit;

--

replace into persons
  (_feedbacksCount, _feedbacksSum, firstname, lastname, tgname, created, deleted, id, tgid)
values
  (0, 0, 'Denis', 'Zhbankov', 'denis_zhbankov', 1650900000, null, '4e583a933d9', '115469675');

replace into countries
  (name, created, deleted, id, tgid)
values
  ('Albania',              1650900000, null, 'hbcco3hgy73', '115469675'),
  ('Bosnia i Herzegovina', 1650900000, null, 'wugw29mxv1w', '115469675'),
  ('Croatia',              1650900000, null, '8jnteunp9pl', '115469675'),
  ('Montenegro',           1650900000, null, 'ifippr1zzqt', '115469675'),
  ('Serbia',               1650900000, null, 'jyqfnqjm3xq', '115469675');

replace into places
  (countryId, name, created, deleted, id, tgid)
values
  ('hbcco3hgy73', 'Bashkimi',     1650900000, null, 'nkstbktengu', '115469675'),
  ('hbcco3hgy73', 'Koplik',       1650900000, null, 'lxt7ulyiw4i', '115469675'),
  ('hbcco3hgy73', 'Shkodër',      1650900000, null, '6wom34y1tie', '115469675'),

  ('wugw29mxv1w', 'Bileća',       1650900000, null, 's1rwfm263u7', '115469675'),
  ('wugw29mxv1w', 'Gacko',        1650900000, null, 'to7nyp5fcng', '115469675'),
  ('wugw29mxv1w', 'Goražde',      1650900000, null, 'jq6yo1m65uc', '115469675'),
  ('wugw29mxv1w', 'Trebinje',     1650900000, null, '7aku8bdzz9y', '115469675'),

  ('8jnteunp9pl', 'Dubrovnik',    1650900000, null, 'jh6cq0gf4hr', '115469675'),

  ('ifippr1zzqt', 'Bar',          1650900000, null, 'no5va8kiiq0', '115469675'),
  ('ifippr1zzqt', 'Berane',       1650900000, null, 'sdu4cz2s6w4', '115469675'),
  ('ifippr1zzqt', 'Bijelo Polje', 1650900000, null, 'vvajmv2kn7s', '115469675'),
  ('ifippr1zzqt', 'Budva',        1650900000, null, 'aonbpsekpi1', '115469675'),
  ('ifippr1zzqt', 'Cetinje',      1650900000, null, 'sor8du5ww88', '115469675'),
  ('ifippr1zzqt', 'Herceg Novi',  1650900000, null, 'w87ms7tlgt1', '115469675'),
  ('ifippr1zzqt', 'Kotor',        1650900000, null, '49ap5tab5vl', '115469675'),
  ('ifippr1zzqt', 'Nikšić',       1650900000, null, 'x06f2x4vw5g', '115469675'),
  ('ifippr1zzqt', 'Petrovac',     1650900000, null, 'ojhzb7hrmci', '115469675'),
  ('ifippr1zzqt', 'Pljevlja',     1650900000, null, 'by4lcxa24qn', '115469675'),
  ('ifippr1zzqt', 'Podgorica',    1650900000, null, 'omkz5u9ssz2', '115469675'),
  ('ifippr1zzqt', 'Rožaje',       1650900000, null, '0ann5o0onrz', '115469675'),
  ('ifippr1zzqt', 'Sitnica',      1650900000, null, 'i27gd9iql29', '115469675'),
  ('ifippr1zzqt', 'Tivat',        1650900000, null, 's2zpnylzn5x', '115469675'),
  ('ifippr1zzqt', 'Ulcinj',       1650900000, null, 'd3lvr56s0o8', '115469675'),

  ('jyqfnqjm3xq', 'Gostun',       1650900000, null, 'nyt1lvyamwh', '115469675'),
  ('jyqfnqjm3xq', 'Jabuka',       1650900000, null, 'ron3dvdly4n', '115469675'),
  ('jyqfnqjm3xq', 'Krnjača',      1650900000, null, 'woabq2ttqgq', '115469675'),
  ('jyqfnqjm3xq', 'Ribariće',     1650900000, null, '83kfaps9nu5', '115469675');

commit;
