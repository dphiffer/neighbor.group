import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { rimraf } from "rimraf";
import { Site } from "./site";

beforeAll(async () => {
	await rimraf("./data/test-site.db");
});

afterAll(async () => {
	await rimraf("./data/test-site.db");
});

describe("site", () => {
	test("insert option", () => {
		const site = new Site("test-site.db");
		site.setOption("test.option", "foo bar baz");
		expect(site.getOption("test.option")).toBe("foo bar baz");
	});

	test("update option", () => {
		const site = new Site("test-site.db");
		expect(site.getOption("test.option")).toBe("foo bar baz");
		site.setOption("test.option", "test test test");
		expect(site.getOption("test.option")).toBe("test test test");
	});

	test("default option value", () => {
		const site = new Site("test-site.db");
		expect(site.getOption("test.key", "test.value")).toBe("test.value");
	});
});
