CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS grammar_content_revisions(pattern_id TEXT NOT NULL,revision INTEGER NOT NULL,content TEXT NOT NULL,PRIMARY KEY(pattern_id,revision));
CREATE TABLE IF NOT EXISTS grammar_progress(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,pattern_id TEXT NOT NULL,read_at TEXT,PRIMARY KEY(user_id,pattern_id));
CREATE TABLE IF NOT EXISTS grammar_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,pattern_id TEXT NOT NULL,revision INTEGER NOT NULL,questions TEXT NOT NULL,responses TEXT NOT NULL DEFAULT '{}',completed_at TEXT,created_at TEXT NOT NULL,UNIQUE(user_id,pattern_id,revision));
CREATE TABLE IF NOT EXISTS grammar_events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,pattern_id TEXT NOT NULL,question_id TEXT NOT NULL,session_id TEXT NOT NULL REFERENCES grammar_sessions(id) ON DELETE CASCADE,day TEXT NOT NULL,UNIQUE(user_id,session_id,question_id,day));
CREATE TABLE IF NOT EXISTS grammar_srs_links(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,pattern_id TEXT NOT NULL,card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,PRIMARY KEY(user_id,pattern_id));
CREATE INDEX IF NOT EXISTS grammar_sessions_owner ON grammar_sessions(user_id,pattern_id);
CREATE INDEX IF NOT EXISTS grammar_events_day ON grammar_events(user_id,day);

CREATE TABLE IF NOT EXISTS grammar_response_history(id INTEGER PRIMARY KEY,session_id TEXT NOT NULL REFERENCES grammar_sessions(id) ON DELETE CASCADE,question_id TEXT NOT NULL,response TEXT NOT NULL,created_at TEXT NOT NULL);
