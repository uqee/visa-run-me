--

  SELECT * FROM countries;

  INSERT INTO countries (name, updated)
  VALUES (4, 'Косово', Datetime('2022-04-24T00:00:00Z'));

  DELETE FROM countries
  WHERE id == 4;

  COMMIT;

-- 2022-04-24

  CREATE TABLE countries (
    id Uint32,
    name Utf8,
    updated Datetime,
    PRIMARY KEY (id)
  );

  COMMIT;

  REPLACE INTO countries
    (id, name, updated)
  VALUES
    (0, 'Албания', Datetime('2022-04-24T00:00:00Z')),
    (1, 'Босния и Герцеговина', Datetime('2022-04-24T00:00:00Z')),
    (2, 'Сербия', Datetime('2022-04-24T00:00:00Z')),
    (3, 'Хорватия', Datetime('2022-04-24T00:00:00Z'));

  COMMIT;
