import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

beforeAll(async () => {
	await rimraf("./data/test-option.db");
});

afterAll(async () => {
	await rimraf("./data/test-option.db");
});

describe("db.option", () => {
	test("insert option", () => {
		const db = new DatabaseConnection("test-option.db");
		db.option.insert("test", "foo");
		const option = db.option.select("test");
		if (option) {
			expect(option.value).toBe("foo");
		}
	});

	test("update option", () => {
		const db = new DatabaseConnection("test-option.db");
		db.option.update("test", "bar");
		const option = db.option.select("test");
		if (option) {
			expect(option.value).toBe("bar");
		}
	});

	test("all options", () => {
		const db = new DatabaseConnection("test-option.db");
		expect(db.option.all().length).toBe(1);
	});

	test("delete option", () => {
		const db = new DatabaseConnection("test-option.db");
		db.option.delete("test");
		expect(db.option.select("test")).toBe(null);
	});
});
