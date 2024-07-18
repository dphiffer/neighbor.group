CREATE TABLE user (
	id BIGINT PRIMARY KEY,
	slug TEXT UNIQUE,
    email TEXT UNIQUE,
	name TEXT,
    password TEXT,
    active NUMBER,
	created TEXT,
	updated TEXT
);
