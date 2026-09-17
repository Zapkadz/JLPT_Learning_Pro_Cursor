CREATE TABLE IF NOT EXISTS schema_migrations(
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kaiwa_projects(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_asset_id TEXT,
  active_revision_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kaiwa_assets(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  checksum TEXT,
  bytes INTEGER,
  media_json TEXT NOT NULL DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kaiwa_revisions(
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES kaiwa_projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'draft',
  payload TEXT NOT NULL DEFAULT '{"segments":[]}',
  source_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(project_id, version)
);

CREATE TABLE IF NOT EXISTS kaiwa_attempts(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES kaiwa_projects(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL REFERENCES kaiwa_revisions(id),
  audio_asset_id TEXT REFERENCES kaiwa_assets(id),
  record_state TEXT NOT NULL DEFAULT 'idle',
  completion TEXT,
  clocks_json TEXT NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  device_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  finalized_at TEXT
);

CREATE TABLE IF NOT EXISTS kaiwa_jobs(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload_version INTEGER NOT NULL DEFAULT 1,
  payload TEXT NOT NULL DEFAULT '{}',
  idempotency_key TEXT,
  state TEXT NOT NULL DEFAULT 'queued',
  retry_count INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  lease_until TEXT,
  progress_json TEXT NOT NULL DEFAULT '{}',
  error_code TEXT,
  error_message TEXT,
  result_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS kaiwa_activity_events(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id TEXT REFERENCES kaiwa_attempts(id) ON DELETE SET NULL,
  event_key TEXT NOT NULL,
  speaking_ms INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL,
  day TEXT NOT NULL,
  UNIQUE(owner_id, event_key, day)
);

CREATE INDEX IF NOT EXISTS kaiwa_projects_owner ON kaiwa_projects(owner_id, updated_at);
CREATE INDEX IF NOT EXISTS kaiwa_revisions_project ON kaiwa_revisions(project_id, version);
CREATE INDEX IF NOT EXISTS kaiwa_attempts_owner ON kaiwa_attempts(owner_id, created_at);
CREATE INDEX IF NOT EXISTS kaiwa_attempts_revision ON kaiwa_attempts(revision_id);
CREATE INDEX IF NOT EXISTS kaiwa_jobs_owner_state ON kaiwa_jobs(owner_id, state);
CREATE INDEX IF NOT EXISTS kaiwa_activity_day ON kaiwa_activity_events(owner_id, day);

CREATE TABLE IF NOT EXISTS kaiwa_quota_reservations(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL UNIQUE REFERENCES kaiwa_assets(id) ON DELETE CASCADE,
  bytes INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS kaiwa_quota_owner ON kaiwa_quota_reservations(owner_id, expires_at);
CREATE INDEX IF NOT EXISTS kaiwa_assets_owner_status ON kaiwa_assets(owner_id, processing_status);

CREATE TABLE IF NOT EXISTS kaiwa_uploads(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES kaiwa_assets(id),
  purpose TEXT NOT NULL,
  expected_bytes INTEGER NOT NULL,
  expected_checksum TEXT,
  chunk_size INTEGER NOT NULL,
  chunk_count INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'open',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kaiwa_upload_chunks(
  upload_id TEXT NOT NULL REFERENCES kaiwa_uploads(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(upload_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS kaiwa_uploads_owner ON kaiwa_uploads(owner_id, state);


