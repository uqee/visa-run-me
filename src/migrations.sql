--

  select * from countries;

  insert into countries (id, name, updated)
  values (1650900000005, 'Kosovo', 1650900000005);

  delete from countries
  where id == 5;

  commit;

-- 2022-04-25

  replace into countries
    (id, name, updated)
  values
    (1650900000000, 'Albania',              1650900000000),
    (1650900000001, 'Bosnia i Herzegovina', 1650900000001),
    (1650900000002, 'Croatia',              1650900000002),
    (1650900000003, 'Montenegro',           1650900000003),
    (1650900000004, 'Serbia',               1650900000004);

  replace into places
    (countryId, id, name, updated)
  values
    (1650900000000, 1650900000000, 'Bashkimi',     1650900000000),
    (1650900000000, 1650900000001, 'Koplik',       1650900000001),
    (1650900000000, 1650900000002, 'Shkodër',      1650900000002),

    (1650900000001, 1650900000003, 'Bileća',       1650900000003),
    (1650900000001, 1650900000004, 'Gacko',        1650900000004),
    (1650900000001, 1650900000005, 'Goražde',      1650900000005),
    (1650900000001, 1650900000006, 'Trebinje',     1650900000006),

    (1650900000002, 1650900000007, 'Dubrovnik',    1650900000007),

    (1650900000003, 1650900000008, 'Bar',          1650900000008),
    (1650900000003, 1650900000009, 'Berane',       1650900000009),
    (1650900000003, 1650900000010, 'Bijelo Polje', 1650900000010),
    (1650900000003, 1650900000011, 'Budva',        1650900000011),
    (1650900000003, 1650900000012, 'Cetinje',      1650900000012),
    (1650900000003, 1650900000013, 'Herceg Novi',  1650900000013),
    (1650900000003, 1650900000014, 'Kotor',        1650900000014),
    (1650900000003, 1650900000015, 'Nikšić',       1650900000015),
    (1650900000003, 1650900000016, 'Petrovac',     1650900000016),
    (1650900000003, 1650900000017, 'Pljevlja',     1650900000017),
    (1650900000003, 1650900000018, 'Podgorica',    1650900000018),
    (1650900000003, 1650900000019, 'Rožaje',       1650900000019),
    (1650900000003, 1650900000020, 'Sitnica',      1650900000020),
    (1650900000003, 1650900000021, 'Tivat',        1650900000021),
    (1650900000003, 1650900000022, 'Ulcinj',       1650900000022),

    (1650900000004, 1650900000023, 'Gostun',       1650900000023),
    (1650900000004, 1650900000024, 'Jabuka',       1650900000024),
    (1650900000004, 1650900000025, 'Krnjača',      1650900000025),
    (1650900000004, 1650900000026, 'Ribariće',     1650900000026);

  commit;

-- 2022-04-24

  -- every 'id' is timestamp (equals 'created')
  -- every 'updated' is timestamp

  create table cars (
    capacity uint8,
    id uint64,
    model utf8,
    personId uint64,
    updated uint64,
    primary key (id)
  );

  create table countries (
    id uint64,
    name utf8,
    updated uint64,
    primary key (id)
  );

  create table feedbacks (
    id uint64,
    personId uint64,
    stars uint8,
    tripId uint64,
    updated uint64,
    primary key (id)
  );

  create table persons (
    _feedbacksCount uint32,
    _feedbacksSum uint32,
    _tripsCount uint32,
    id uint64,
    tgid uint64,
    tgfullname utf8,
    tgusername string,
    updated uint64,
    primary key (id)
  );

  create table places (
    countryId uint64,
    id uint64,
    name utf8,
    updated uint64,
    primary key (id)
  );

  create table trips (
    capacityMax uint8,
    capacityMin uint8,
    countryId uint64,
    id uint64,
    name utf8,
    status uint8, -- Todo | Arranged | Canceled | Done
    updated uint64,
    primary key (id)
  );

  create table tripCars (
    carId uint64,
    id uint64,
    tripId uint64,
    updated uint64,
    primary key (id)
  );

  create table tripPlaces (
    agenda utf8,
    arrival uint64,
    duration uint64,
    id uint64,
    placeId uint64,
    price uint32,
    tripId uint32,
    updated uint64,
    primary key (id)
  );

  create table tripPersons (
    id uint64,
    personId uint64,
    role uint8, -- Driver | Passenger
    tripId uint64,
    updated uint64,
    primary key (id)
  );

  create table needs (
    departure uint64,
    id uint64,
    personId uint64,
    price uint32,
    placeId uint64,
    status uint8, -- Todo | Arranged | Canceled | Done
    tripId uint64,
    updated uint64,
    primary key (id)
  );

  commit;
