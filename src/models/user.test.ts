import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import DatabaseConnection from "../db";
import { rimraf } from "rimraf";
import User from "./user";

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
			id: BigInt(0),
			name: "test",
			email: "test@test.test",
			slug: "test",
			password: "test-test-test",
		});
		expect(user.data.name).toBe("test");
		expect(user.data.password).not.toBe("test-test-test"); // hashed
	});

	test("load user", () => {
		const load = User.load(db, BigInt(1));
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
		const user = User.load(db, BigInt(1));
		user.data.name = "test-updated";
		user.save();
		const user2 = User.load(db, "test");
		expect(user2.data.name).toBe("test-updated");
	});

	test("set and check password", async () => {
		const user = User.load(db, BigInt(1));
		await user.setPassword("test-pw-updated");
		expect(await user.checkPassword("test-pw-updated")).toBe(true);
	});

	test("delete user", async () => {
		const user = await User.create(db, {
			id: BigInt(0),
			name: "test",
			email: "test-deletion@test.test",
			password: "test-test-test",
		});
		user.delete();
		try {
			expect(User.load(db, user.data.id)).toThrow(Error);
		} catch (_) {}
	});
});
