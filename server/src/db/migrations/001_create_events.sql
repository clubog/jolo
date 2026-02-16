CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  address VARCHAR(500) NOT NULL,
  bezirk VARCHAR(100) NOT NULL,
  kiez VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  event_type VARCHAR(100) NOT NULL,
  energy_score INT NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  social_score INT NOT NULL CHECK (social_score BETWEEN 1 AND 5),
  source VARCHAR(255),
  url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_bezirk ON events(bezirk);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_type ON events(event_type);
