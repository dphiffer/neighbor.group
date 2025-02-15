import { Database } from "better-sqlite3";

export interface OptionRow {
	key: string;
	value: string;
	created: Date;
	updated: Date;
}

export default class OptionQueries {
	db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	all() {
		let stmt = this.db.prepare(`
			SELECT *
			FROM option
		`);
		return stmt.all() as OptionRow[];
	}

	select(key: string) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM option
			WHERE key = ?
		`);
		let row = stmt.get(key) as OptionRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	insert(key: string, value: string) {
		let stmt = this.db.prepare(`
			INSERT INTO option
			(key, value, created, updated)
			VALUES ($key, $value, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		return stmt.run({
			key: key,
			value: value,
		});
	}

	update(key: string, value: string) {
		let stmt = this.db.prepare(`
			UPDATE option
			SET value = $value,
			    updated = CURRENT_TIMESTAMP
			WHERE key = $key
		`);
		return stmt.run({
			key: key,
			value: value,
		});
	}

	delete(key: string) {
		let stmt = this.db.prepare(`
			DELETE FROM option
			WHERE key = ?
		`);
		return stmt.run(key);
	}
}
