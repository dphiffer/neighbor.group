import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

beforeAll(async () => {
	await rimraf("./data/test-db-message.db");
});

afterAll(async () => {
	await rimraf("./data/test-db-message.db");
});

describe("db.groups", () => {
	let messageId: number;

	test("post a new message", () => {
		const db = new DatabaseConnection("test-db-message.db");
		let result = db.user.insert({
			name: "test",
			slug: "test",
			email: "test@test.test",
			active: 1,
			password: "Test 1 two",
		});
		let userId = Number(result.lastInsertRowid);
		result = db.groups.insert({
			name: 'Group',
			slug: 'group',
			description: 'Group for message testing.',
		});
		let groupId = Number(result.lastInsertRowid);
		result = db.message.insert({
			message: 'This is a test message.',
			group_id: groupId,
			user_id: userId,
		});
		expect(typeof result.lastInsertRowid).toBe('number');
		messageId = Number(result.lastInsertRowid);
		const message = db.message.select(messageId)!;
		expect(message.message).toEqual('This is a test message.');
	});

	test("select a non-existent message", () => {
		const db = new DatabaseConnection("test-db-message.db");
		const message = db.message.select(99);
		expect(message).toEqual(null);
	});

	test("update a message", () => {
		const db = new DatabaseConnection("test-db-message.db");
		db.message.update(messageId, {
			message: 'This is an updated test message.'
		});
		const message = db.message.select(messageId)!;
		expect(message.message).toEqual('This is an updated test message.');
	});

	test("delete a message", () => {
		const db = new DatabaseConnection("test-db-message.db");
		db.message.delete(messageId);
		const message = db.message.select(messageId);
		expect(message).toEqual(null);
	});
});