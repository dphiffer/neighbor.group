import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

describe("db.user", () => {
	beforeAll(async () => {
		await rimraf("./data/test-db-user.db");
	});

	afterAll(async () => {
		await rimraf("./data/test-db-user.db");
	});

	test("insert and select user", () => {
		const db = new DatabaseConnection("test-db-user.db");
		const insert = db.user.insert({
			name: "test",
			slug: "test",
			email: "test@test.test",
			active: 1,
			password: "test-test-test",
		});
		const select = db.user.select(BigInt(insert.lastInsertRowid));
		if (!select) {
			throw new Error("could not select inserted user");
		}
		expect(select.name).toBe("test");
		expect(select.email).toBe("test@test.test");
		expect(select.password).toBe("test-test-test");
	});

	test("select non-existent user", () => {
		const db = new DatabaseConnection("test-db-user.db");
		const select = db.user.select(BigInt(0));
		expect(select).toBe(null);
	});

	test("load and update user", () => {
		const db = new DatabaseConnection("test-db-user.db");
		const load = db.user.loadBy("slug", "test");
		if (load) {
			db.user.update(load.id, {
				name: "updated-name",
			});
		}
		const load2 = db.user.loadBy("slug", "test");
		if (load2) {
			expect(load2.name).toBe("updated-name");
		}
	});

	test("all users", () => {
		const db = new DatabaseConnection("test-db-user.db");
		expect(db.user.all().length).toBe(1);
	});

	test("delete user", () => {
		const db = new DatabaseConnection("test-db-user.db");
		db.user.delete(BigInt(1));
		const load = db.user.select(BigInt(1));
		expect(load).toBe(null);
		const load2 = db.user.loadBy("slug", "test");
		expect(load2).toBe(null);
	});
});
