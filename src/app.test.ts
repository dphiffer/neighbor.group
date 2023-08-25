import { describe, expect, test } from "@jest/globals";
import buildApp from "../src/app";

describe("app", () => {
	const app = buildApp();

	test("home page", async () => {
		const rsp = await app.inject({
			method: "GET",
			url: "/",
		});
		expect(rsp.statusCode).toBe(200);
	});

	test("health check endpoint", async () => {
		const rsp = await app.inject({
			method: "GET",
			url: "/_health-check",
		});
		expect(rsp.statusCode).toBe(200);
	});
});
