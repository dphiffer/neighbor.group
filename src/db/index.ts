import DatabaseConstructor, { Database } from "better-sqlite3";
import fs from "fs";
import { glob } from "glob";
import path from "path";
import OptionQueries from "./option";
import UserQueries from "./user";

export default class DatabaseConnection {
	conn: Database;
	option: OptionQueries;
	user: UserQueries;

	static connections: Database[] = [];

	constructor(name: string) {
		this.conn = DatabaseConnection.getConnection(name);
		this.option = new OptionQueries(this.conn);
		this.user = new UserQueries(this.conn);
	}

	static getConnection(name: string) {
		let root = path.dirname(path.dirname(__dirname));
		let dbPath = path.resolve(path.join(root, "data", name));
		let [db] = this.connections.filter((db) => db.name === dbPath);
		if (!db) {
			db = new DatabaseConstructor(dbPath);
			this.connections.push(db);
			this.migrate(db);
		}
		return db;
	}

	static migrate(db: Database) {
		let dbVersion = db.pragma("user_version", { simple: true }) as number;
		let migrationsDir = path.join(path.dirname(db.name), "migrations");
		let migrations = glob.sync(path.join(migrationsDir, "*.sql"));
		migrations.sort();
		for (let file of migrations) {
			let versionMatch = path.basename(file).match(/^\d+/);
			if (versionMatch) {
				let migrationVersion = parseInt(versionMatch[0]);
				if (dbVersion < migrationVersion) {
					db.transaction(() => {
						let sql = fs.readFileSync(file, "utf8");
						db.exec(sql);
					})();
				}
				db.pragma(`user_version = ${migrationVersion}`);
			}
		}
		return db;
	}
}
