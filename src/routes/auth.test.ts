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
	let passwordResetId: string;

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

	test("load password reset page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/password",
		});
		expect(response.statusCode).toBe(200);
	});

	test("start password reset", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/password",
		});
		expect(response.statusCode).toBe(302);
		const urlMatch = ("" + response.headers.location).match(
			/\/password\/(.+)$/
		);
		if (urlMatch) {
			passwordResetId = urlMatch[1];
		}
		expect(passwordResetId.length).toBe(40);
	});

	test("invalid password reset", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/password/does-not-exist",
		});
		expect(response.statusCode).toBe(302);
	});

	test("valid password reset id", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: `/password/${passwordResetId}`,
		});
		expect(response.statusCode).toBe(200);
	});

	test("invalid password reset code", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/${passwordResetId}`,
			body: {
				code: "incorrect",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("valid password reset code", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/${passwordResetId}`,
			body: {
				code: "correct",
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("change password page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "GET",
			url: `/password/reset`,
		});
		expect(response.statusCode).toBe(200);
	});

	test("change password submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/reset`,
			body: {
				password: "foo",
			},
		});
		expect(response.statusCode).toBe(302);
	});
});
