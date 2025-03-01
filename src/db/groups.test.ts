import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

beforeAll(async () => {
	await rimraf("./data/test-db-groups.db");
});

afterAll(async () => {
	await rimraf("./data/test-db-groups.db");
});

describe("db.groups", () => {
	let groupId: number;

	test("insert and select a group", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		const result = db.groups.insert({
			name: 'Test group',
			slug: 'test-group',
			description: 'Testing out group insertion.',
		});
		expect(typeof result.lastInsertRowid).toBe('number');
		groupId = Number(result.lastInsertRowid);
		const group = db.groups.select(groupId)!;
		expect(group.name).toEqual('Test group');
	});

	test("select a non-existent group", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		const group = db.groups.select(99);
		expect(group).toEqual(null);
	});

	test("load a group by slug", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		const group = db.groups.loadBySlug('test-group')!;
		expect(group.name).toEqual('Test group');
	});

	test("load a non-existent group by slug", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		const group = db.groups.loadBySlug('does-not-exist')!;
		expect(group).toEqual(null);
	});

	test("update a group", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		db.groups.update(groupId, {
			name: 'Updated name'
		});
		const group = db.groups.select(groupId)!;
		expect(group.name).toEqual('Updated name');
	});

	test("delete a group", () => {
		const db = new DatabaseConnection("test-db-groups.db");
		db.groups.delete(groupId);
		const group = db.groups.select(groupId);
		expect(group).toEqual(null);
	});
});