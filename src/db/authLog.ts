import { Database } from "better-sqlite3";

export interface AuthLogRow {
	id: number;
	ip_address: string;
	event: string;
	description: string;
	created?: Date;
}

export default class AuthLogQueries {
	db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	getRecentErrors(ipAddress: string, event: string) {
		const now = new Date();
		const yyyy = now.getUTCFullYear();
		const m = now.getUTCMonth();
		const mm = (m < 10) ? `0${m}` : m;
		const d = now.getUTCDay();
		const dd = (d < 10) ? `0${d}` : d;
		const stmt = this.db.prepare(`
			SELECT *
			FROM auth_log
			WHERE ip_address = $ipAddress
			  AND event = $event
			  AND created > $today
			ORDER BY created DESC
		`);
		return stmt.all({
			ipAddress: ipAddress,
			event: `${event} error`,
			today: `${yyyy}-${mm}-${dd} 00:00:00`
		}) as AuthLogRow[];
	}

	select(id: string) {
		let stmt = this.db.prepare(`
			SELECT *
			FROM auth_log
			WHERE id = ?
		`);
		let row = stmt.get(id) as AuthLogRow | null;
		if (!row) {
			return null;
		}
		return row;
	}

	insert(values: Partial<AuthLogRow>) {
		const cols = [];
		const placeholders = [];
		for (const col of Object.keys(values)) {
			if (col !== 'created') {
				cols.push(col);
				placeholders.push(`$${col}`);
			}
		}
		let stmt = this.db.prepare(`
			INSERT INTO auth_log
			(${cols.join(", ")}, created)
			VALUES (${placeholders.join(", ")}, CURRENT_TIMESTAMP)
		`);
		return stmt.run(values);
	}
}