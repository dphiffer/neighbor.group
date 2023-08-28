import bcrypt from "bcrypt";
import DatabaseConnection from "../db";
import { UserRow } from "../db/user";
import { FastifyRequest } from "fastify";

export default class UserModel {
	db: DatabaseConnection;
	data: UserRow;

	constructor(db: DatabaseConnection, data: UserRow) {
		this.db = db;
		this.data = data;
	}

	static async create(db: DatabaseConnection, data: UserRow) {
		const saltRounds = 10;
		data.password = await bcrypt.hash(data.password, saltRounds);
		data.slug = this.getDefaultSlug(db, data.email);
		data.active = 1;
		const result = db.user.insert(data);
		data.id = result.lastInsertRowid as bigint;
		return new UserModel(db, data);
	}

	static load(db: DatabaseConnection, id: bigint | string) {
		let data: UserRow | null = null;
		const emailRegex = /^\w+@\w+\.\w+$/;
		const slugRegex = /^[a-z][a-z0-9_-]*$/i;
		if (typeof id == "bigint") {
			data = db.user.select(id);
		} else if (typeof id == "string") {
			if (id.match(emailRegex)) {
				data = db.user.loadBy("email", id);
			} else if (id.match(slugRegex)) {
				data = db.user.loadBy("slug", id);
			}
		}
		if (!data) {
			throw new Error(`User '${id}' not found`);
		}
		return new UserModel(db, data);
	}

	static getDefaultSlug(db: DatabaseConnection, email: string) {
		const emailMatch = email.match(/^(.+)@/);
		let slug = "";
		let prefix = "user";
		if (emailMatch) {
			prefix = emailMatch[1];
			slug = prefix;
		}
		let suffix = 0;
		while (db.user.loadBy("slug", slug)) {
			suffix++;
			slug = `${prefix}${suffix}`;
		}
		return slug;
	}

	static getCurrent(db: DatabaseConnection, request: FastifyRequest) {
		let id = request.session.get("user.id");
		if (id) {
			return this.load(db, BigInt(id));
		} else {
			return null;
		}
	}

	save() {
		this.db.user.update(this.data.id, this.data);
		this.data = this.db.user.select(this.data.id)!;
		return this;
	}

	async checkPassword(password: string) {
		if (!this.data) {
			return false;
		}
		const result = await bcrypt.compare(password, this.data.password);
		return result;
	}

	async setPassword(password: string) {
		const saltRounds = 10;
		this.data.password = await bcrypt.hash(password, saltRounds);
		this.save();
		return this;
	}

	delete() {
		this.db.user.delete(this.data.id);
	}
}