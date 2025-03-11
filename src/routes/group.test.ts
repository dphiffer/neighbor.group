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

describe("group routes", () => {
	const ORIG_ENV = process.env;
	let session: Cookie;
	let passwordResetId: string;
	let dbName = 'test-group-routes.db';

	beforeAll(async () => {
		await rimraf(`./data/${dbName}`);
	});

	afterAll(async () => {
		process.env = ORIG_ENV;
		await rimraf(`./data/${dbName}`);
	});

	test("load new group page", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		await app.inject({
			method: "POST",
			url: "/signup",
			body: {
				name: "test",
				email: "test@test.test",
				password: "Test 1 two",
			},
		});
		const response1 = await app.inject({
			method: "POST",
			url: "/login",
			body: {
				email: "test@test.test",
				password: "Test 1 two",
			},
		});
		session = response1.cookies[0];
		const response2 = await app.inject({
			method: "GET",
			url: "/new",
			cookies: {
				session: session.value,
			},
		});
		expect(response2.statusCode).toBe(200);
	});

	test("load new group page not logged in", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/new",
			// cookies: {
			// 	session: session.value,
			// },
		});
		expect(response.statusCode).toBe(302);
	});

	test("post new group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/new",
			body: {
				name: "Test",
				slug: "test-group"
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("post new group not signed in", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/new",
			body: {
				name: "Test",
				slug: "test-group"
			},
			// cookies: {
			// 	session: session.value,
			// },
		});
		expect(response.statusCode).toBe(401);
	});

	test("post new group with missing details", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/new",
			body: {
				name: "Test",
				slug: ""
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("load new group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/test-group",
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(200);
	});

	test("load non-existent group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/does-not-exist",
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(404);
	});

	test("load a group while not signed in", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "GET",
			url: "/test-group",
			// cookies: {
			// 	session: session.value,
			// },
		});
		expect(response.statusCode).toBe(302);
	});

	test("post a message to a group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/test-group",
			body: {
				message: "This is a test message.",
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(302);
	});

	test("post an empty message to a group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/test-group",
			body: {
				message: "",
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(400);
	});

	test("post a message to a non-existent group", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/does-not-exist",
			body: {
				message: "Test message.",
			},
			cookies: {
				session: session.value,
			},
		});
		expect(response.statusCode).toBe(404);
	});

	test("post a message to a group while not signed in", async () => {
		process.env.DATABASE = dbName;
		const app = await buildApp();
		const response = await app.inject({
			method: "POST",
			url: "/test-group",
			body: {
				message: "Test message.",
			},
			// cookies: {
			// 	session: session.value,
			// },
		});
		expect(response.statusCode).toBe(400);
	});
});
