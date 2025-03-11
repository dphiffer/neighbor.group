import { Database } from "better-sqlite3";

export interface GroupMemberRow {
	group_id: number;
	user_id: number;
	created?: Date;
}

export default class GroupMemberQueries {
	db: Database;
	
	constructor(db: Database) {
		this.db = db;
	}

	insert(values: GroupMemberRow) {
		let stmt = this.db.prepare(`
			INSERT INTO group_member
			(group_id, user_id, created)
			VALUES ($user_id, $group_id, CURRENT_TIMESTAMP)
		`);
		return stmt.run({ ... values});
	}

	select(groupId: number, userId: number) {
		const stmt = this.db.prepare(`
			SELECT *
			FROM group_member
			WHERE group_id = ?
			  AND user_id = ?
		`);
		const row = stmt.get(groupId, userId) as GroupMemberRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	delete(groupId: number, userId: number) {
		let stmt = this.db.prepare(`
			DELETE
			FROM group_member
			WHERE group_id = ?
			  AND user_id = ?
		`);
		return stmt.run(groupId, userId);
	}

}