import { Database } from "better-sqlite3";

export interface MessageRow {
	id: number;
	group_id: number;
	user_id: number;
	message: string;
	active?: number;
	created?: Date;
	updated?: Date;
}

export default class MessageQueries {
	db: Database;
	
	constructor(db: Database) {
		this.db = db;
	}

	query(groupId: number) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM message
			WHERE group_id = $groupId
			  AND active = 1
		`);
		return stmt.all({
			groupId: groupId
		}) as MessageRow[];
	}

	select(id: number) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM message
			WHERE id = ?
			AND active = 1
		`);
		let row = stmt.get(id) as MessageRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	insert(values: Partial<MessageRow>) {
		const cols = [];
		const placeholders = [];
		const skipCols = ["id", "active", "created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				cols.push(col);
				placeholders.push(`$${col}`);
			}
		}
		let stmt = this.db.prepare(`
			INSERT INTO message
			(${cols.join(", ")}, active, created, updated)
			VALUES (${placeholders.join(", ")}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		return stmt.run({ ... values});
	}

	update(id: number, values: Partial<MessageRow>) {
		const assignments = [];
		const skipCols = ["id", "created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				assignments.push(`${col} = $${col}`);
			}
		}
		let stmt = this.db.prepare(`
			UPDATE message
			SET ${assignments.join(", ")},
				updated = CURRENT_TIMESTAMP
			WHERE id = $id
		`);
		return stmt.run({
			id: id,
			...values,
		});
	}

	delete(id: number) {
		let stmt = this.db.prepare(`
			UPDATE message
			SET active = 0
			WHERE id = ?
		`);
		return stmt.run(id);
	}
}