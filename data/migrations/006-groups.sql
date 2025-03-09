CREATE TABLE IF NOT EXISTS groups (
	id INTEGER PRIMARY KEY,
	slug TEXT UNIQUE,
	name TEXT,
	description TEXT,
	active NUMBER,
	created TEXT,
	updated TEXT
);
CREATE INDEX IF NOT EXISTS groups_idx ON groups (id, slug, active);