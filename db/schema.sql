CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  subject     TEXT,
  message     TEXT        NOT NULL,
  ip_hash     TEXT,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS messages_ip_hash_idx ON messages (ip_hash, created_at);

CREATE TABLE IF NOT EXISTS page_views (
  id    INT PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO page_views (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
