CREATE TABLE IF NOT EXISTS auth_log (
	id INTEGER PRIMARY KEY,
	ip_address TEXT,
	event TEXT,
	description TEXT,
	created TEXT
);
