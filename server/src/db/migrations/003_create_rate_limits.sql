CREATE TABLE rate_limits (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(ip, date)
);

CREATE INDEX idx_rate_limits_lookup ON rate_limits(ip, date);
