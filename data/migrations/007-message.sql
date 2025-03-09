CREATE TABLE message (
	id INTEGER PRIMARY KEY,
	group_id INTEGER,
	user_id INTEGER,
	message TEXT,
	active NUMBER,
	created TEXT,
	updated TEXT
);
CREATE INDEX message_idx ON message (id, group_id, user_id, active);