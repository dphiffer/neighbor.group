import { Database } from "better-sqlite3";

export interface GroupsRow {
	id: number;
	name: string;
	slug: string;
	description: string;
	active?: number;
	created?: Date;
	updated?: Date;
}

export default class GroupsQueries {
	db: Database;
	
	constructor(db: Database) {
		this.db = db;
	}

	all() {
		let stmt = this.db.prepare(`
			SELECT *
			FROM groups
			WHERE active = 1
		`);
		return stmt.all() as GroupsRow[];
	}

	select(id: number) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM groups
			WHERE id = ?
			AND active = 1
		`);
		let row = stmt.get(id) as GroupsRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	loadBySlug(slug: string) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM groups
			WHERE slug = ?
			AND active = 1
		`);
		let row = stmt.get(slug) as GroupsRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	insert(values: Partial<GroupsRow>) {
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
			INSERT INTO groups
			(${cols.join(", ")}, active, created, updated)
			VALUES (${placeholders.join(", ")}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`);
		return stmt.run({ ... values});
	}

	update(id: number, values: Partial<GroupsRow>) {
		const assignments = [];
		const skipCols = ["id", "created", "updated"];
		for (const col of Object.keys(values)) {
			if (skipCols.indexOf(col) === -1) {
				assignments.push(`${col} = $${col}`);
			}
		}
		let stmt = this.db.prepare(`
			UPDATE groups
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
			UPDATE groups
			SET active = 0
			WHERE id = ?
		`);
		return stmt.run(id);
	}
};