import { Database } from "better-sqlite3";

export interface PasswordResetRow {
	id: string;
	user_id: number;
	code: string;
	status: string;
	created?: Date;
	updated?: Date;
}

export default class PasswordResetQueries {
	db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	insert(values: Partial<PasswordResetRow>) {
		const cols = [];
		const placeholders = [];
		const skipCols = ["created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				cols.push(col);
				placeholders.push(`$${col}`);
			}
		}
		let stmt = this.db.prepare(`
			INSERT INTO password_reset
			(${cols.join(", ")}, created, updated)
			VALUES (${placeholders.join(", ")}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		return stmt.run(values);
	}

	select(id: string) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM password_reset
			WHERE id = ?
		`);
		let row = stmt.get(id) as PasswordResetRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	update(id: string, values: Partial<PasswordResetRow>) {
		const assignments = [];
		const skipCols = ["created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				assignments.push(`${col} = $${col}`);
			}
		}
		let stmt = this.db.prepare(`
			UPDATE password_reset
			SET ${assignments.join(', ')}, updated = CURRENT_TIMESTAMP
			WHERE id = $id
		`);
		return stmt.run({
			id: id,
			...values
		});
	}
}