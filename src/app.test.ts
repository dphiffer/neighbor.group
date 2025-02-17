import {
	jest,
	describe,
	expect,
	test,
	beforeAll,
	beforeEach,
	afterAll,
} from "@jest/globals";
import buildApp from "./app";
import { rimraf } from "rimraf";

describe("app", () => {
	const ORIG_ENV = process.env;

	beforeAll(async () => {
		await rimraf("./data/test-app.db");
	});

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...ORIG_ENV };
	});

	afterAll(async () => {
		process.env = ORIG_ENV;
		await rimraf("./data/test-app.db");
	});

	test("home page", async () => {
		process.env.DATABASE = "test-app.db";
		const app = await buildApp();
		const rsp = await app.inject({
			method: "GET",
			url: "/",
		});
		expect(rsp.statusCode).toBe(200);
	});

	test("health check endpoint", async () => {
		process.env.DATABASE = "test-app.db";
		const app = await buildApp();
		const rsp = await app.inject({
			method: "GET",
			url: "/_health-check",
		});
		expect(rsp.statusCode).toBe(200);
	});
});
