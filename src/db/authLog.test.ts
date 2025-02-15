import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import DatabaseConnection from "./";

beforeAll(async () => {
	await rimraf("./data/test-db-auth-log.db");
});

afterAll(async () => {
	await rimraf("./data/test-db-auth-log.db");
});

describe("db.auth_log", () => {
	test("insert auth log entry", () => {
		const db = new DatabaseConnection("test-db-auth-log.db");
		const result = db.authLog.insert({
			ip_address: '127.0.0.1',
			event: 'test event',
			description: 'Testing out the auth log',
		});
		expect(typeof result.lastInsertRowid).toBe('number');
	});

	test("select recent auth log errors", () => {
		const db = new DatabaseConnection("test-db-auth-log.db");
		db.authLog.insert({
			ip_address: '127.0.0.1',
			event: 'test error',
			description: 'Error: something went wrong',
		});

		const errors = db.authLog.getRecentErrors('127.0.0.1', 'test');
		expect(errors.length).toBeGreaterThan(0);
	});
});
