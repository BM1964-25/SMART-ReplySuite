PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mail_responses (
  id TEXT PRIMARY KEY,
  subject TEXT,
  inbound_message TEXT NOT NULL,
  notes TEXT,
  response_goal TEXT,
  extra_hints TEXT,
  response_type TEXT NOT NULL,
  tone TEXT NOT NULL,
  length TEXT NOT NULL,
  focus TEXT NOT NULL,
  language TEXT NOT NULL,
  company_style TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'reply',
  ai_analysis TEXT,
  main_response TEXT,
  alternative_response TEXT,
  short_response TEXT,
  diplomatic_response TEXT,
  quality_score TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Allgemein',
  body TEXT NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TEXT,
  activation_id TEXT,
  checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mail_responses_created_at ON mail_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_responses_type ON mail_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_favorite ON templates(favorite);
