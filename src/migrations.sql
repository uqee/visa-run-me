--

  SELECT * FROM countries;

  INSERT INTO countries (name, updated)
  VALUES (5, 'Kosovo', Datetime('2022-04-24T00:00:00Z'));

  DELETE FROM countries
  WHERE id == 5;

  COMMIT;

-- 2022-04-25

  REPLACE INTO Countries
    (id, name, updated)
  VALUES
    (0, 'Albania',              Datetime('2022-04-24T00:00:00Z')),
    (1, 'Bosnia i Herzegovina', Datetime('2022-04-24T00:00:00Z')),
    (2, 'Croatia',              Datetime('2022-04-24T00:00:00Z')),
    (3, 'Montenegro',           Datetime('2022-04-24T00:00:00Z')),
    (4, 'Serbia',               Datetime('2022-04-24T00:00:00Z'));

  REPLACE INTO Places
    (countryId, id, name, updated)
  VALUES
    (0, 0,  'Bashkimi',     Datetime('2022-04-24T00:00:00Z')),
    (0, 1,  'Koplik',       Datetime('2022-04-24T00:00:00Z')),
    (0, 2,  'Shkodër',      Datetime('2022-04-24T00:00:00Z')),

    (1, 3,  'Bileća',       Datetime('2022-04-24T00:00:00Z')),
    (1, 4,  'Gacko',        Datetime('2022-04-24T00:00:00Z')),
    (1, 5,  'Goražde',      Datetime('2022-04-24T00:00:00Z')),
    (1, 6,  'Trebinje',     Datetime('2022-04-24T00:00:00Z')),

    (2, 7,  'Dubrovnik',    Datetime('2022-04-24T00:00:00Z')),

    (3, 8,  'Bar',          Datetime('2022-04-24T00:00:00Z')),
    (3, 9,  'Berane',       Datetime('2022-04-24T00:00:00Z')),
    (3, 10, 'Bijelo Polje', Datetime('2022-04-24T00:00:00Z')),
    (3, 11, 'Budva',        Datetime('2022-04-24T00:00:00Z')),
    (3, 12, 'Cetinje',      Datetime('2022-04-24T00:00:00Z')),
    (3, 13, 'Herceg Novi',  Datetime('2022-04-24T00:00:00Z')),
    (3, 14, 'Kotor',        Datetime('2022-04-24T00:00:00Z')),
    (3, 15, 'Nikšić',       Datetime('2022-04-24T00:00:00Z')),
    (3, 16, 'Petrovac',     Datetime('2022-04-24T00:00:00Z')),
    (3, 17, 'Pljevlja',     Datetime('2022-04-24T00:00:00Z')),
    (3, 18, 'Podgorica',    Datetime('2022-04-24T00:00:00Z')),
    (3, 19, 'Rožaje',       Datetime('2022-04-24T00:00:00Z')),
    (3, 20, 'Sitnica',      Datetime('2022-04-24T00:00:00Z')),
    (3, 21, 'Tivat',        Datetime('2022-04-24T00:00:00Z')),
    (3, 22, 'Ulcinj',       Datetime('2022-04-24T00:00:00Z')),

    (4, 23, 'Gostun',       Datetime('2022-04-24T00:00:00Z')),
    (4, 24, 'Jabuka',       Datetime('2022-04-24T00:00:00Z')),
    (4, 25, 'Krnjača',      Datetime('2022-04-24T00:00:00Z')),
    (4, 26, 'Ribariće',     Datetime('2022-04-24T00:00:00Z'));

  COMMIT;

-- 2022-04-24

  CREATE TABLE Cars (
    capacity Uint8,
    id Uint32,
    model Utf8,
    personId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Countries (
    id Uint32,
    name Utf8,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Feedbacks (
    id Uint32,
    personId Uint32,
    stars Uint8,
    tripId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Persons (
    _feedbackCount Uint32,
    _feedbackSum Uint32,
    _tripsCount Uint32,
    id Uint32,
    tgId Uint64,
    tgUsername String,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Places (
    countryId Uint32,
    id Uint32,
    name Utf8,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Trips (
    capacityMax Uint8,
    capacityMin Uint8,
    countryId Uint32,
    id Uint32,
    name Utf8,
    status Uint8, -- Offered | Settled | Canceled | Finished
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE TripCars (
    carId Uint32,
    id Uint32,
    tripId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE TripPlaces (
    agenda Utf8,
    datetimeIn Datetime,
    datetimeOut Datetime, -- ?
    id Uint32,
    placeId Uint32,
    price Uint8, -- to return?
    tripId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE TripPersons (
    id Uint32,
    personId Uint32,
    role Uint8, -- Driver | Passenger
    tripId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  CREATE TABLE Wishes (
    date Date,
    id Uint32,
    personId Uint32,
    placeId Uint32,
    tripId Uint32,
    updated Datetime,
    PRIMARY KEY (id)
  );

  COMMIT;
