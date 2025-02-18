CREATE INDEX option_idx ON option (key, value);
CREATE INDEX user_idx ON user (id, slug, email, active);
CREATE INDEX auth_log_idx ON auth_log (id, ip_address, event, created);