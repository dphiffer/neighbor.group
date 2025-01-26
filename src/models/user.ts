import bcrypt from "bcrypt";
import DatabaseConnection from "../db";
import { UserRow } from "../db/user";
import { FastifyRequest } from "fastify";
import * as crypto from "node:crypto";

export default class UserModel {
	db: DatabaseConnection;
	data: UserRow;

	constructor(db: DatabaseConnection, data: UserRow) {
		this.db = db;
		this.data = data;
	}

	static async create(db: DatabaseConnection, data: UserRow) {
		if (!data.name || !data.email || !data.password) {
			throw new Error("Please enter a name, email, and password.");
		}
		if (data.email.indexOf("@") === -1) {
			throw new Error("Please enter a valid email address.");
		}
		const saltRounds = 10;
		data.password = await bcrypt.hash(data.password, saltRounds);
		data.slug = this.getDefaultSlug(db, data.email);
		data.active = 1;
		const result = db.user.insert(data);
		data.id = result.lastInsertRowid as number;
		return new UserModel(db, data);
	}

	static load(db: DatabaseConnection, id: number | string) {
		let data: UserRow | null = null;
		const emailRegex = /^\w+@\w+\.\w+$/;
		const slugRegex = /^[a-z][a-z0-9_-]*$/i;
		if (typeof id == "number") {
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

	static getVerificationId() {
		return crypto.randomBytes(20).toString('hex');
	}

	static verifyPasswordReset(db: DatabaseConnection, id: string, code: string) {
		const passwordReset = db.passwordReset.select(id);
		if (!passwordReset || passwordReset.code !== code) {
			throw new Error('Invalid password reset');
		}
		const user = UserModel.load(db, passwordReset.user_id);
		if (!user) {
			throw new Error('Invalid password reset');
		}
		return user;
	}

	save() {
		this.db.user.update(this.data.id, this.data);
		this.data = this.db.user.select(this.data.id)!;
		return this;
	}

	async checkPassword(password: string) {
		const result = await bcrypt.compare(password, this.data.password);
		return result;
	}

	async setPassword(password: string) {
		const saltRounds = 10;
		this.data.password = await bcrypt.hash(password, saltRounds);
		this.save();
		return this;
	}

	resetPassword() {
		const id = UserModel.getVerificationId();
		const code = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
		console.log(`Password reset use code: ${code}`);
		const result = this.db.passwordReset.insert({
			id: id,
			user_id: this.data.id,
			code: code,
			status: 'unclaimed',
		});
		return id;
	}

	delete() {
		this.db.user.delete(this.data.id);
	}
}
