import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import DatabaseConnection from "../db";
import { rimraf } from "rimraf";
import User, { dailyErrorLimits } from "./user";

describe("user model", () => {
	let db: DatabaseConnection;

	beforeAll(async () => {
		await rimraf("./data/test-model-user.db");
		db = new DatabaseConnection("test-model-user.db");
	});

	afterAll(async () => {
		await rimraf("./data/test-model-user.db");
	});

	test("create user", async () => {
		const user = await User.create(db, {
			id: 0,
			name: "test",
			email: "test@test.test",
			slug: "test",
			password: "Test 1 two",
		});
		expect(user.data.name).toBe("test");
		expect(user.data.password).not.toBe("Test 1 two"); // hashed
	});

	test("create duplicate email user", async () => {
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test2",
					email: "test@test.test",
					slug: "test",
					password: "Test 1 two",
				})
			).toThrow();
		} catch (_) {}
	});

	test("create bad password user", async () => {
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test2",
					email: "test2@test.test",
					slug: "test",
					password: "short",
				})
			).toThrow();
		} catch (_) {}
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test2",
					email: "test2@test.test",
					slug: "test",
					password: "ALL CAPS",
				})
			).toThrow();
		} catch (_) {}
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test2",
					email: "test2@test.test",
					slug: "test",
					password: "all lowercase",
				})
			).toThrow();
		} catch (_) {}
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test2",
					email: "test2@test.test",
					slug: "test",
					password: "No numbers",
				})
			).toThrow();
		} catch (_) {}
	});

	test("create invalid user", async () => {
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "test",
					email: "test(a)test.test", // no @ sign
					slug: "test",
					password: "Test 1 two",
				})
			).toThrow();
		} catch (_) {}
		try {
			expect(
				await User.create(db, {
					id: 0,
					name: "", // no name set
					email: "test@test.test",
					slug: "test",
					password: "Test 1 two",
				})
			).toThrow();
		} catch (_) {}
	});

	test("load user", () => {
		const load = User.load(db, 1);
		expect(load.data.name).toBe("test");
		const load2 = User.load(db, "test");
		expect(load2.data.email).toBe("test@test.test");
		const load3 = User.load(db, "test@test.test");
		expect(load2.data.slug).toBe("test");
	});

	test("default slug", () => {
		const slug = User.getDefaultSlug(db, "foo@foo.foo");
		expect(slug).toBe("foo");
		const slug2 = User.getDefaultSlug(db, "test@example.com");
		expect(slug2).not.toBe("test"); // duplicate with test@test.test
	});

	test("user does not exist", () => {
		try {
			expect(User.load(db, "does-not-exist")).toThrow(Error);
		} catch (_) {}
	});

	test("save user", () => {
		const user = User.load(db, 1);
		user.data.name = "test-updated";
		user.save();
		const user2 = User.load(db, "test");
		expect(user2.data.name).toBe("test-updated");
	});

	test("set and check password", async () => {
		const user = User.load(db, 1);
		await user.setPassword("test-pw-updated");
		expect(await user.checkPassword("test-pw-updated")).toBe(true);
	});

	test("delete user", async () => {
		const user = await User.create(db, {
			id: 0,
			name: "test",
			email: "test-deletion@test.test",
			password: "Test 1 two",
		});
		user.delete();
		try {
			expect(User.load(db, user.data.id)).toThrow(Error);
		} catch (_) {}
	});

	test("insert auth log", () => {
		User.authLog(db, '1.2.3.4', 'test error', 'Testing auth log insertion');
		const errors = db.authLog.getRecentErrors('1.2.3.4', 'test');
		expect(errors.length).toBe(1);
	});

	test("auth log daily limit", () => {
		try {
			for (let i = 0; i < dailyErrorLimits.login + 1; i++) {
				User.checkAuthErrors(db, '1.2.3.4', 'login');
				User.authLog(db, '1.2.3.4', 'login error', 'Testing auth log daily limit');
			}
		} catch(_) {}
		const errors = db.authLog.getRecentErrors('1.2.3.4', 'login');
		expect(errors.length).toBe(dailyErrorLimits.login);
	});

	test("stringified user", async () => {
		const user = await User.create(db, {
			id: 0,
			name: "testing",
			email: "test2@test.test",
			slug: "test",
			password: "Test 1 two",
		});
		expect(`test: ${user}`).toBe("test: testing");
	});
});
