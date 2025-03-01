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

const nodemailer = require("nodemailer"); // doesn't work with import.
jest.mock("nodemailer");
const sendMailMock = jest.fn();
nodemailer.createTransport.mockReturnValue({
	sendMail: sendMailMock
});

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
		sendMailMock.mockClear();
		nodemailer.createTransport.mockClear();
	});

	afterAll(async () => {
		process.env = ORIG_ENV;
		await rimraf("./data/test-auth-routes.db");
	});

	test("load signup page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/signup",
		});
		expect(response.statusCode).toBe(200);
	});

	test("signup submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/signup",
			body: {
				name: "test",
				email: "test@test.test",
				password: "Test 1 two",
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("invalid signup submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/signup",
			body: {
				name: "test",
				email: "",
				password: "Test 1 two",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("load login page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/login",
		});
		expect(response.statusCode).toBe(200);
	});

	test("login post", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "Test 1 two",
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].name).toBe("session");
		expect(response.statusCode).toBe(302);
		session = response.cookies[0];
	});

	test("invalid login submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "",
				password: "Test 1 two",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("login with wrong password", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "wrong password",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("redirect logged in users", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
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

	test("login redirect", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "Test 1 two",
				redirect: "/foo"
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].name).toBe("session");
		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toEqual('/foo');
	});

	test("login with invalid redirect", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "Test 1 two",
				redirect: "https://www.google.com/"
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].name).toBe("session");
		expect(response.statusCode).toBe(302);
		expect(response.headers.location).toEqual('/');
	});

	test("logout", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/logout",
			cookies: {
				session: session.value,
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].value).toBe("");
		expect(response.statusCode).toBe(302);
	});

	test("load password reset page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/password",
		});
		expect(response.statusCode).toBe(200);
	});

	test("start valid password reset", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		process.env.EMAIL_FROM = "test@test.test";
		process.env.SMTP_HOST = "test.test";
		process.env.SMTP_PORT = "465";
		process.env.SMTP_SECURE = "true";
		process.env.SMTP_USER = "test";
		process.env.SMTP_PASS = "test";
		const app = await buildApp();
		sendMailMock.mockImplementation((message: any, callback: any) => {
			callback(false, null);
		});
		const response = await app.inject({
			method: "POST",
			body: {
				email: "test@test.test",
			},
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
		expect(sendMailMock).toHaveBeenCalled();
		
		// Change the code to something we can test later
		app.db.passwordReset.update(passwordResetId, {
			code: '123456'
		});
	});

	test("password reset enter code", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: `/password/${passwordResetId}`,
		});
		expect(response.statusCode).toBe(200);
	});

	test("valid password reset code", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/${passwordResetId}`,
			body: {
				code: "123456",
			},
		});
		expect(response.cookies.length).toBe(1);
		expect(response.cookies[0].name).toBe("session");
		expect(response.statusCode).toBe(302);
		session = response.cookies[0];
	});

	test("change password page", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: `/password/reset`,
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(200);
	});

	test("change password submission", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/reset`,
			body: {
				password: "Test one 2",
				password2: "Test one 2",
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(200);
	});

	test("invalid password resets", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		let response = await app.inject({
			method: "POST",
			body: {
				email: "",
			},
			url: "/password",
		});
		expect(response.statusCode).toBe(400);

		response = await app.inject({
			method: "POST",
			body: {
				email: "invalid(a)test.test",
			},
			url: "/password",
		});
		expect(response.statusCode).toBe(400);
	});

	test("password reset when email isn't configured", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			body: {
				email: "test@test.test",
			},
			url: "/password",
		});
		expect(response.statusCode).toBe(400);
	});

	test("password reset email send error", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		process.env.EMAIL_FROM = "test@test.test";
		process.env.SMTP_HOST = "test.test";
		process.env.SMTP_PORT = "465";
		process.env.SMTP_SECURE = "true";
		process.env.SMTP_USER = "test";
		process.env.SMTP_PASS = "test";
		const app = await buildApp();
		sendMailMock.mockImplementation((message: any, callback: any) => {
			callback(new Error('The email message did not send.'), null);
		});
		const response = await app.inject({
			method: "POST",
			body: {
				email: "test@test.test",
			},
			url: "/password",
		});
		expect(response.statusCode).toBe(400);
	});

	test("password reset as authenticated user", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/password/reset-id",
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("invalid password reset code", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: `/password/${passwordResetId}`,
			body: {
				code: "incorrect",
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("change password as non-authenticated user", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/password/reset",
		});
		expect(response.statusCode).toBe(302);
	});

	test("change password submission, passwords don't match", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		app.db.conn.exec("DELETE FROM auth_log");
		const response = await app.inject({
			method: "POST",
			url: `/password/reset`,
			body: {
				password: "Test one 2",
				password2: "Test two 3",
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("change password submission as non-authenticated user", async () => {
		process.env.DATABASE = "test-auth-routes.db";
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/password/reset",
			body: {
				password: "Test one 2",
				password2: "Test one 2",
			},
		});
		expect(response.statusCode).toBe(400);
	});
});
