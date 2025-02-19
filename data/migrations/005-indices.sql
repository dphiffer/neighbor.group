CREATE INDEX IF NOT EXISTS option_idx ON option (key, value);
CREATE INDEX IF NOT EXISTS user_idx ON user (id, slug, email, active);
CREATE INDEX IF NOT EXISTS auth_log_idx ON auth_log (id, ip_address, event, created);