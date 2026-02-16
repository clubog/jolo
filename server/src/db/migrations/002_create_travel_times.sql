CREATE TABLE travel_times (
  id SERIAL PRIMARY KEY,
  from_bezirk VARCHAR(100) NOT NULL,
  to_bezirk VARCHAR(100) NOT NULL,
  minutes INT NOT NULL,
  UNIQUE(from_bezirk, to_bezirk)
);
