import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from ".";

beforeAll(async () => {
	await rimraf("./data/test-db-group-member.db");
});

afterAll(async () => {
	await rimraf("./data/test-db-group-member.db");
});

describe("db.groups", () => {
	let memberId: number;

	test("insert and select a group member", () => {
		const db = new DatabaseConnection("test-db-group-member.db");
		const result = db.groupMember.insert({
			group_id: 1,
			user_id: 1,
		});
		expect(typeof result.lastInsertRowid).toBe('number');
		memberId = Number(result.lastInsertRowid);
		const membership = db.groupMember.select(1, 1)!;
		expect(typeof membership.created).toBe('string');
	});

	test("select a non-existent membership", () => {
		const db = new DatabaseConnection("test-db-group-member.db");
		const membership = db.groupMember.select(99, 99);
		expect(membership).toEqual(null);
	});

	test("delete a membership", () => {
		const db = new DatabaseConnection("test-db-group-member.db");
		db.groupMember.delete(1, 1);
		const membership = db.groupMember.select(1, 1);
		expect(membership).toEqual(null);
	});
});