import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import DatabaseConnection from "../db";
import { rimraf } from "rimraf";
import Group from "./group";

describe("group model", () => {
	let db: DatabaseConnection;
	let groupId: number;

	beforeAll(async () => {
		await rimraf("./data/test-model-group.db");
		db = new DatabaseConnection("test-model-group.db");
	});

	afterAll(async () => {
		await rimraf("./data/test-model-group.db");
	});

	test("create a valid group", () => {
		const group = Group.create(db, {
			id: 0,
			name: "Test",
			description: "This is a test group.",
			slug: "test",
		});
		expect(group.data.name).toBe("Test");
		expect(group.data.description).toBe("This is a test group.");
		expect(group.data.slug).toBe("test");
		expect(group.data.active).toBe(1);
		groupId = group.data.id;
	});

	test("create a group without required values", () => {
		try {
			expect(Group.create(db, {
				id: 0,
				name: "", // no name
				description: "This is a test group.",
				slug: "test",
			})).toThrow(Error);
		} catch(_) {}
		try {
			expect(Group.create(db, {
				id: 0,
				name: "Test",
				description: "This is a test group.",
				slug: "", // no slug
			})).toThrow(Error);
		} catch(_) {}
	});

	test("create a group with an existing slug", () => {
		try {
			expect(Group.create(db, {
				id: 0,
				name: "Test",
				description: "This is a test group.",
				slug: "test",
			})).toThrow(Error);
		} catch(_) {}
	});

	test("create a group with a forbidden slug", () => {
		try {
			expect(Group.create(db, {
				id: 0,
				name: "Test",
				description: "This is a test group.",
				slug: "new",
			})).toThrow(Error);
		} catch(_) {}
	});

	test("select all groups", () => {
		const groups = Group.all(db);
		expect(groups.length).toBeGreaterThan(0);
		expect(groups[0] instanceof Group).toBe(true);
	});

	test("load a group by id", () => {
		const group = Group.load(db, groupId)!;
		expect(group.data.name).toEqual('Test');
	});

	test("load a group by slug", () => {
		const group = Group.load(db, 'test')!;
		expect(group.data.name).toEqual('Test');
	});

	test("load a non-existent group", () => {
		try {
			expect(Group.load(db, 'does-not-exist')).toThrow(Error);
		} catch(_) {}
	});

	test("add a group member", () => {
		const group = Group.load(db, 'test')!;
		const response = group.addMember(db, 25);
		expect(group.hasMember(db, 25)).toBeTruthy();
	});

	test("remove a group member", () => {
		const group = Group.load(db, 'test')!;
		group.removeMember(db, 25);
		expect(group.hasMember(db, 25)).toBeFalsy();
	});
});