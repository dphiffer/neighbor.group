import DatabaseConnection from "../db";
import { GroupsRow } from "../db/groups";

export default class GroupModel {
	db: DatabaseConnection;
	data: GroupsRow;

	constructor(db: DatabaseConnection, data: GroupsRow) {
		this.db = db;
		this.data = data;
	}

	static async create(db: DatabaseConnection, data: GroupsRow) {
		if (!data.name || !data.slug) {
			throw new Error("Please enter a name and URL for your group.");
		}
		if (db.groups.loadBySlug(data.slug)) {
			throw new Error("Sorry, that URL address is registered to an existing group.");
		}
		data.active = 1;
		const result = db.groups.insert(data);
		data.id = result.lastInsertRowid as number;
		return new GroupModel(db, data);
	}

	static load(db: DatabaseConnection, id: number | string) {
		let data: GroupsRow | null = null;
		const slugRegex = /^[a-z][a-z0-9_-]*$/i;
		if (typeof id == "number") {
			data = db.groups.select(id);
		} else if (typeof id == "string") {
			data = db.groups.loadBySlug(id);
		}
		if (!data) {
			throw new Error(`Group '${id}' not found.`);
		}
		return new GroupModel(db, data);
	}
}