drop table caches;
drop table needs;
drop table persons;
drop table places;
drop table tripPlaces;
drop table trips;

commit;

--

create table caches (
  key string,
  value string,

  created uint32,
  primary key (key)
);

create table needs (
  maxday uint32,
  maxprice uint8,
  personId string,
  placeId string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index needs_tgid_idx global on (tgid),
  primary key (id)
);

create table persons (
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
  name utf8,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index places_tgid_idx global on (tgid),
  primary key (id)
);

create table trips (
  capacity uint8,
  day uint32,
  personId string,

  created uint32,
  deleted uint32,
  id string,
  tgid string,
  index trips_tgid_idx global on (tgid),
  primary key (id)
);

create table tripPlaces (
  minprice uint8,
  placeId string,
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

delete from persons;
delete from places;

commit;

--
-- https://www.random.org/strings/
-- 11 lowercased letters and digits

replace into persons
  (firstname, lastname, tgname, created, deleted, id, tgid)
values
  ('Denis', 'Zhbankov', 'denis_zhbankov', 1650900000, null, '4e583a933d9', '115469675');

replace into places
  (name, created, deleted, id, tgid)
values
  ('Bar',          1650900000, null, 'no5va8kiiq0', '115469675'),
  ('Berane',       1650900000, null, 'sdu4cz2s6w4', '115469675'),
  ('Bijelo Polje', 1650900000, null, 'vvajmv2kn7s', '115469675'),
  ('Budva',        1650900000, null, 'aonbpsekpi1', '115469675'),
  ('Cetinje',      1650900000, null, 'sor8du5ww88', '115469675'),
  ('Herceg Novi',  1650900000, null, 'w87ms7tlgt1', '115469675'),
  ('Kotor',        1650900000, null, '49ap5tab5vl', '115469675'),
  ('Nikšić',       1650900000, null, 'x06f2x4vw5g', '115469675'),
  ('Petrovac',     1650900000, null, 'ojhzb7hrmci', '115469675'),
  ('Pljevlja',     1650900000, null, 'by4lcxa24qn', '115469675'),
  ('Podgorica',    1650900000, null, 'omkz5u9ssz2', '115469675'),
  ('Rožaje',       1650900000, null, '0ann5o0onrz', '115469675'),
  ('Sitnica',      1650900000, null, 'i27gd9iql29', '115469675'),
  ('Tivat',        1650900000, null, 's2zpnylzn5x', '115469675'),
  ('Ulcinj',       1650900000, null, 'd3lvr56s0o8', '115469675');

commit;
