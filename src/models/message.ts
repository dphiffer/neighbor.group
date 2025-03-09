import DatabaseConnection from "../db";
import { MessageRow } from "../db/message";
import UserModel from "./user";
import marked from "marked";

export default class MessageModel {
	db: DatabaseConnection;
	data: MessageRow;
	user: UserModel | null = null;

	constructor(db: DatabaseConnection, data: MessageRow) {
		this.db = db;
		this.data = data;
		if (this.data.user_id) {
			this.user = UserModel.load(db, this.data.user_id);
		}
	}

	static query(db: DatabaseConnection, groupId: number) {
		const rows = db.message.query(groupId);
		return rows.map(row => {
			return new MessageModel(db, row);
		});
	}

	static create(db: DatabaseConnection, data: MessageRow) {
		if (!data.message) {
			throw new Error("Please enter a message to post.");
		}
		data.active = 1;
		const result = db.message.insert(data);
		data.id = result.lastInsertRowid as number;
		return new MessageModel(db, data);
	}

	static load(db: DatabaseConnection, id: number) {
		let data = db.message.select(id);
		if (!data) {
			throw new Error(`Message '${id}' not found.`);
		}
		return new MessageModel(db, data);
	}

	toString() {
		return marked.parse(this.data.message);
	}
	
}