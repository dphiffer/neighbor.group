import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

beforeAll(async () => {
	await rimraf("./data/test-db-password-reset.db");
});

afterAll(async () => {
	await rimraf("./data/test-db-password-reset.db");
});

describe("db.password_reset", () => {
	test("insert password reset entry", () => {
		const db = new DatabaseConnection("test-db-auth-log.db");
		const result = db.passwordReset.insert({
			id: 'hard-to-guess-password-reset-id',
			user_id: 1,
			code: '123456',
			status: 'unclaimed',
		});
		expect(typeof result.lastInsertRowid).toBe('number');
	});

	test("select invalid password reset entry", () => {
		const db = new DatabaseConnection("test-db-auth-log.db");
		const result = db.passwordReset.select('does-not-exist');
		expect(result).toBeNull();
	});

	test("select valid password reset entry", () => {
		const db = new DatabaseConnection("test-db-auth-log.db");
		const result = db.passwordReset.select('hard-to-guess-password-reset-id');
		expect(typeof result).toBe('object');
	});
});