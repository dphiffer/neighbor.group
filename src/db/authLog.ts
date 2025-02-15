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

	getRecentErrors(ipAddress: string, event: string) {
		const today = new Date().toISOString().substring(0, 10);
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
			today: `${today} 00:00:00`
		}) as AuthLogRow[];
	}
}