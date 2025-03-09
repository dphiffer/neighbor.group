import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import DatabaseConnection from "../db";
import { rimraf } from "rimraf";
import GroupModel from "./group";
import UserModel from "./user";
import MessageModel from "./message";

describe("message model", () => {
	let db: DatabaseConnection;
	let messageId: number;
	let groupId: number;
	let userId: number;

	beforeAll(async () => {
		await rimraf("./data/test-model-message.db");
		db = new DatabaseConnection("test-model-message.db");
	});

	afterAll(async () => {
		await rimraf("./data/test-model-message.db");
	});

	test("create a message", async () => {
		const group = GroupModel.create(db, {
			id: 0,
			name: "Test",
			description: "Test group for testing messages.",
			slug: "test",
		});
		groupId = group.data.id;
		const user = await UserModel.create(db, {
			id: 0,
			name: "test",
			email: "test@test.test",
			slug: "test",
			password: "Test 1 two",
		});
		userId = user.data.id;
		const message = MessageModel.create(db, {
			id: 0,
			group_id: groupId,
			user_id: userId,
			message: "This is a test.",
		});
		expect(message.data.id).toBeGreaterThan(0);
		messageId = message.data.id;
	});

	test("create an empty message", async () => {
		try {
			expect(MessageModel.create(db, {
				id: 0,
				group_id: groupId,
				user_id: userId,
				message: "",
			})).toThrow();
		} catch(_) {}
	});

	test("query messages", () => {
		const messages = MessageModel.query(db, groupId);
		expect(messages.length).toBeGreaterThan(0);
	});

	test("load a message by ID", () => {
		const message = MessageModel.load(db, messageId);
		expect(typeof message.data.id).toBe('number');
	});

	test("load a non-existent message", () => {
		try {
			expect(MessageModel.load(db, 99)).toThrow();
		} catch(_) {}
	});

	test("stringified markdown formatted message", () => {
		const message = MessageModel.create(db, {
			id: 0,
			group_id: groupId,
			user_id: userId,
			message: "This is a *test*.",
		});
		expect(message.toString()).toBe('<p>This is a <em>test</em>.</p>\n');
	});
});