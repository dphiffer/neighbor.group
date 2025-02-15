import { Database } from "better-sqlite3";

export interface UserRow {
	id: number;
	name: string;
	email: string;
	password: string;
	slug?: string;
	active?: number;
	created?: Date;
	updated?: Date;
}

export default class UserQueries {
	db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	all() {
		let stmt = this.db.prepare(`
			SELECT *
			FROM user
            WHERE active = 1
		`);
		return stmt.all() as UserRow[];
	}

	select(id: number) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM user
			WHERE id = ?
			AND active = 1
		`);
		let row = stmt.get(id) as UserRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	loadBy(key: "slug" | "email" | "phone", value: string) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM user
			WHERE ${key} = ?
            AND active = 1
		`);
		let row = stmt.get(value) as UserRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	insert(values: Partial<UserRow>) {
		const cols = [];
		const placeholders = [];
		const skipCols = ["id", "created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				cols.push(col);
				placeholders.push(`$${col}`);
			}
		}
		let stmt = this.db.prepare(`
			INSERT INTO user
			(${cols.join(", ")}, created, updated)
			VALUES (${placeholders.join(", ")}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		return stmt.run(values);
	}

	update(id: number, values: Partial<UserRow>) {
		const assignments = [];
		const skipCols = ["id", "created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				assignments.push(`${col} = $${col}`);
			}
		}
		let stmt = this.db.prepare(`
			UPDATE user
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
			UPDATE user
			SET active = 0
            WHERE id = ?
		`);
		return stmt.run(id);
	}
}
