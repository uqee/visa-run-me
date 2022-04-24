--

  SELECT * FROM countries;

  INSERT INTO countries (name, updated)
  VALUES (4, 'Косово', Datetime('2022-04-24T00:00:00Z'));

  DELETE FROM countries
  WHERE id == 4;

  COMMIT;

-- 2022-04-25

  REPLACE INTO Countries
    (id, name, updated)
  VALUES
    (0, 'Albania',              Datetime('2022-04-24T00:00:00Z')),
    (1, 'Bosnia i Herzegovina', Datetime('2022-04-24T00:00:00Z')),
    (2, 'Croatia',              Datetime('2022-04-24T00:00:00Z')),
    (3, 'Serbia',               Datetime('2022-04-24T00:00:00Z'));

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
    datetime Datetime, -- datetimeReturn?
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
