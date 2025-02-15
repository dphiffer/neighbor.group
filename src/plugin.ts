import DatabaseConnection from "./db";
import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import fastifySecureSession from "@fastify/secure-session";
import sodium from "sodium-native";
import User from "./models/user";

export class SitePlugin {
	db: DatabaseConnection;

	constructor(dbPath: string, app?: FastifyInstance) {
		this.db = new DatabaseConnection(dbPath);
		if (app) {
			this.setupSessions(app);
			this.setupPreHandler(app);
		}
	}

	setupSessions(app: FastifyInstance) {
		let sessionKey = this.getOption("session.key");
		if (!sessionKey) {
			let buffer = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
			sodium.randombytes_buf(buffer);
			sessionKey = buffer.toString("hex");
			this.setOption("session.key", sessionKey);
		}
		app.register(fastifySecureSession, {
			key: Buffer.from(sessionKey, "hex"),
			cookie: {
				path: "/",
			},
		});
	}

	setupPreHandler(app: FastifyInstance) {
		app.addHook("preHandler", (request, reply, done) => {
			request.user = this.getCurrentUser(request);
			reply.locals = {
				user: this.getCurrentUser(request),
			};
			done();
		});
	}

	getCurrentUser(request: FastifyRequest) {
		const id = request.session.get("user.id");
		if (id) {
			return User.load(this.db, id);
		} else {
			return null;
		}
	}

	getOption(key: string, defaultValue: string = "") {
		let option = this.db.option.select(key);
		if (option) {
			return option.value;
		}
		return defaultValue;
	}

	setOption(key: string, value: string) {
		let option = this.db.option.select(key);
		if (option) {
			this.db.option.update(key, value);
		} else {
			this.db.option.insert(key, value);
		}
	}
}

export function getDatabasePath() {
	return process.env.DATABASE || "main.db";
}

export default fastifyPlugin(async (app: FastifyInstance) => {
	const dbPath = getDatabasePath();
	let sitePlugin = new SitePlugin(dbPath, app);
	app.decorate("db", sitePlugin.db);
	app.decorate("setOption", sitePlugin.setOption.bind(sitePlugin));
	app.decorate("getOption", sitePlugin.getOption.bind(sitePlugin));
	app.decorateRequest("user", null);
});
