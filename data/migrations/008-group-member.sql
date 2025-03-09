CREATE TABLE group_member (
	group_id INTEGER,
	user_id INTEGER,
	created TEXT
);
CREATE INDEX group_member_idx ON group_member (group_id, user_id);