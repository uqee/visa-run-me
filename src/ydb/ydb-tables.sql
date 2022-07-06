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
  personId uint32,
  placeId uint32,

  created uint32,
  deleted uint32,
  id uint32,
  tgid uint64,
  index needs_tgid_idx global on (tgid),
  primary key (id)
);

create table persons (
  firstname utf8,
  lastname utf8,
  -- tgid uint64,
  tgname string,

  created uint32,
  deleted uint32,
  id uint32,
  tgid uint64,
  index persons_tgid_idx global on (tgid),
  primary key (id)
);

create table places (
  name utf8,

  created uint32,
  deleted uint32,
  id uint32,
  tgid uint64,
  index places_tgid_idx global on (tgid),
  primary key (id)
);

create table trips (
  capacity uint8,
  day uint32,
  personId uint32,

  created uint32,
  deleted uint32,
  id uint32,
  tgid uint64,
  index trips_tgid_idx global on (tgid),
  primary key (id)
);

create table tripPlaces (
  minprice uint8,
  placeId uint32,
  tripId uint32,

  created uint32,
  deleted uint32,
  id uint32,
  tgid uint64,
  index tripPlaces_tripId_idx global on (tripId),
  primary key (id)
);

commit;

--
-- https://www.random.org/strings/
-- 11 lowercased letters and digits

replace into persons
  (firstname, lastname, tgname, created, deleted, id, tgid)
values
  ('Denis', 'Zhbankov', 'denis_zhbankov', 1650900000, null, 0, 115469675);

replace into places
  (name, created, deleted, id, tgid)
values
  ('Bar',          1650900000, null,  0, 115469675),
  ('Berane',       1650900000, null,  1, 115469675),
  ('Bijelo Polje', 1650900000, null,  2, 115469675),
  ('Budva',        1650900000, null,  3, 115469675),
  ('Cetinje',      1650900000, null,  4, 115469675),
  ('Herceg Novi',  1650900000, null,  5, 115469675),
  ('Kotor',        1650900000, null,  6, 115469675),
  ('Nikšić',       1650900000, null,  7, 115469675),
  ('Petrovac',     1650900000, null,  8, 115469675),
  ('Pljevlja',     1650900000, null,  9, 115469675),
  ('Podgorica',    1650900000, null, 10, 115469675),
  ('Rožaje',       1650900000, null, 11, 115469675),
  ('Sitnica',      1650900000, null, 12, 115469675),
  ('Tivat',        1650900000, null, 13, 115469675),
  ('Ulcinj',       1650900000, null, 14, 115469675);

commit;
