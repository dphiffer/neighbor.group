CREATE TABLE user (
	id INTEGER PRIMARY KEY,
	slug TEXT UNIQUE,
	email TEXT UNIQUE,
	name TEXT,
	password TEXT,
	active NUMBER,
	created TEXT,
	updated TEXT
);
