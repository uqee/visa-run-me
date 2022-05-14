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
  feedback uint8, -- stars
  maxday uint32,
  maxprice uint8,
  personId string,
  placeId string,
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

replace into persons
  (_feedbacksCount, _feedbacksSum, firstname, lastname, tgname, created, deleted, id, tgid)
values
  (0, 0, 'Denis', 'Zhbankov', 'denis_zhbankov', 1650900000, null, '4e583a933d9', '115469675');

-- https://www.gov.me/en/article/border-crossing-points
-- https://www.random.org/strings/, 11 lowercased letters and digits
replace into places
  (name, created, deleted, id, tgid)
values
  ('AL-ME: Baškim - Grnčar',              1650900000, null, 'ko6bbro3wh6', '115469675'),
  ('AL-ME: Hani Hotit - Božaj',           1650900000, null, '4prq7tfaada', '115469675'),
  ('AL-ME: Murićani - Sukobin',           1650900000, null, '7n7djxhst3d', '115469675'),
  ('AL-ME: Zarijebačka Grabom - Cijevna', 1650900000, null, 't0by1nxuqe3', '115469675'),
  ('AL: Shkodër',                         1650900000, null, 'npahbie4v7n', '115469675'),

  ('BA-ME: Aranđelovo - Nudo',     1650900000, null, 'sddfhn9k43x', '115469675'),
  ('BA-ME: Deleuša - Vraćenovići', 1650900000, null, 'wtclvt5hzwm', '115469675'),
  ('BA-ME: Hum - Šćepan polje',    1650900000, null, '7lt2km1j8ec', '115469675'),
  ('BA-ME: Klobuk - Ilino brdo',   1650900000, null, '4ad4mgnmnea', '115469675'),
  ('BA-ME: Krstac - Krstac',       1650900000, null, 'g3zv6etm42u', '115469675'),
  ('BA-ME: Metaljka - Metaljka',   1650900000, null, 'moo1gs5z2xn', '115469675'),
  ('BA-ME: Vitine - Šula',         1650900000, null, 'y3uu1hrwlu1', '115469675'),
  ('BA-ME: Zupci - Sitnica',       1650900000, null, 'je2icadisyd', '115469675'),
  ('BA: Trebinje',                 1650900000, null, 'pinccu3aoox', '115469675'),

  ('HR-ME: Karasovići - Debeli brijeg', 1650900000, null, 'kxb2o0sl51o', '115469675'),
  ('HR-ME: Vitaljina - Kobila',         1650900000, null, 'lnbjcd58tq2', '115469675'),
  ('HR: Dubrovnik',                     1650900000, null, 'cnbs0nqk0hp', '115469675'),

  ('ME: Bar',          1650900000, null, 'no5va8kiiq0', '115469675'),
  ('ME: Berane',       1650900000, null, 'sdu4cz2s6w4', '115469675'),
  ('ME: Bijelo Polje', 1650900000, null, 'vvajmv2kn7s', '115469675'),
  ('ME: Budva',        1650900000, null, 'aonbpsekpi1', '115469675'),
  ('ME: Cetinje',      1650900000, null, 'sor8du5ww88', '115469675'),
  ('ME: Herceg Novi',  1650900000, null, 'w87ms7tlgt1', '115469675'),
  ('ME: Kotor',        1650900000, null, '49ap5tab5vl', '115469675'),
  ('ME: Nikšić',       1650900000, null, 'x06f2x4vw5g', '115469675'),
  ('ME: Petrovac',     1650900000, null, 'ojhzb7hrmci', '115469675'),
  ('ME: Pljevlja',     1650900000, null, 'by4lcxa24qn', '115469675'),
  ('ME: Podgorica',    1650900000, null, 'omkz5u9ssz2', '115469675'),
  ('ME: Rožaje',       1650900000, null, '0ann5o0onrz', '115469675'),
  ('ME: Sitnica',      1650900000, null, 'i27gd9iql29', '115469675'),
  ('ME: Tivat',        1650900000, null, 's2zpnylzn5x', '115469675'),
  ('ME: Ulcinj',       1650900000, null, 'd3lvr56s0o8', '115469675'),

  ('RS-ME: Godovo - Vuča',         1650900000, null, '5c7wzj2eqyo', '115469675'),
  ('RS-ME: Gostun - Dobrakovo',    1650900000, null, 'eo68eocbfj6', '115469675'),
  ('RS-ME: Jabuka - Ranče',        1650900000, null, '9tnmx739olq', '115469675'),
  ('RS-ME: Čemerno - Čemerno',     1650900000, null, 's5j8eflj98y', '115469675'),
  ('RS-ME: Špiljani - Dračenovac', 1650900000, null, 'niqljq7oo1s', '115469675'),
  ('RS: Novi Pazar',               1650900000, null, 'hf5vqawqhm0', '115469675'),
  ('RS: Prijepolje',               1650900000, null, '3kw07f1pmnx', '115469675'),
  ('RS: Sjenica',                  1650900000, null, 'fsuyaoezmkl', '115469675'),

  ('XK-ME: Kulina - Kula', 1650900000, null, '04ttvrbmz9l', '115469675'),
  ('XK: Peja',             1650900000, null, 'i48429pwf9s', '115469675');

commit;
