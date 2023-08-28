import {
	jest,
	describe,
	expect,
	test,
	beforeAll,
	beforeEach,
	afterAll,
} from "@jest/globals";
import { rimraf } from "rimraf";
import { SitePlugin, getDatabasePath } from "./plugin";
import { fastify, FastifyRequest } from "fastify";
import User from "./models/user";

describe("plugin", () => {
	const ORIG_ENV = process.env;

	beforeAll(async () => {
		await rimraf("./data/test-plugin.db");
	});

	beforeEach(() => {
		jest.resetModules();
		process.env = { ...ORIG_ENV };
	});

	afterAll(async () => {
		process.env = ORIG_ENV;
		await rimraf("./data/test-plugin.db");
	});

	test("insert option", () => {
		const plugin = new SitePlugin("test-plugin.db");
		plugin.setOption("test.option", "foo bar baz");
		expect(plugin.getOption("test.option")).toBe("foo bar baz");
	});

	test("update option", () => {
		const plugin = new SitePlugin("test-plugin.db");
		expect(plugin.getOption("test.option")).toBe("foo bar baz");
		plugin.setOption("test.option", "test test test");
		expect(plugin.getOption("test.option")).toBe("test test test");
	});

	test("default option value", () => {
		const plugin = new SitePlugin("test-plugin.db");
		expect(plugin.getOption("test.key", "test.value")).toBe("test.value");
	});

	test("setup sessions", () => {
		process.env.DATABASE = "test-plugin.db";
		const plugin = new SitePlugin("test-plugin.db");
		const app = fastify();
		plugin.db.option.delete("session.key");
		expect(plugin.getOption("session.key")).toBe("");
		plugin.setupSessions(app);
		expect(plugin.getOption("session.key")).not.toBe("");
	});

	test("user session", async () => {
		process.env.DATABASE = "test-plugin.db";
		const plugin = new SitePlugin("test-plugin.db");
		await User.create(plugin.db, {
			id: BigInt(0),
			name: "test",
			email: "test@test.test",
			password: "test-test-test",
		});
		const mockRequest = {
			session: {
				get: (_: string) => {
					return 1;
				},
			},
		} as FastifyRequest;
		const user = plugin.getCurrentUser(mockRequest);
		expect(user?.data.name).toBe("test");
	});

	test("database path", () => {
		expect(getDatabasePath()).toBe("main.db");
		process.env.DATABASE = "test-plugin.db";
		expect(getDatabasePath()).toBe("test-plugin.db");
	});
});
