CREATE TABLE password_reset (
	id TEXT PRIMARY KEY,
	user_id INTEGER,
	code TEXT,
	status TEXT,
	created TEXT,
	updated TEXT
);
