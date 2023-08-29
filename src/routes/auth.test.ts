import {
	jest,
	describe,
	expect,
	test,
	beforeAll,
	beforeEach,
	afterAll,
} from "@jest/globals";
import buildApp from "../app";
import { rimraf } from "rimraf";
import { Cookie } from "fastify";

describe("auth routes", () => {
	const ORIG_ENV = process.env;
	let session: Cookie;

	beforeAll(async () => {
		await rimraf("./data/test-auth-routes.db");
	});

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...ORIG_ENV };
	});

	afterAll(async () => {
		process.env = ORIG_ENV;
		await rimraf("./data/test-auth-routes.db");
	});

	test("load signup page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/signup",
		});
		expect(response.statusCode).toBe(200);
	});

	test("signup submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/signup",
			body: {
				name: "test",
				email: "test@test.test",
				password: "test-test-test",
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("invalid signup submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/signup",
			body: {
				name: "test",
				email: "",
				password: "test-test-test",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("load login page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/login",
		});
		expect(response.statusCode).toBe(200);
	});

	test("login submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "test-test-test",
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].name).toBe("session");
		expect(response.statusCode).toBe(302);
		session = response.cookies[0];
	});

	test("invalid login submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "",
				password: "test-test-test",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("redirect logged in users", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/login",
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(302);

		const response2 = await app.inject({
			method: "GET",
			url: "/signup",
			cookies: {
				session: session.value,
			},
		});
		expect(response2.statusCode).toBe(302);
	});

	test("logout", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/logout",
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].value).toBe("");
		expect(response.statusCode).toBe(302);
	});
});
