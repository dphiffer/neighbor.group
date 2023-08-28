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
			app.log.info("Generating session key");
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
			reply.locals = {
				user: this.getCurrentUser(request),
			};
			done();
		});
	}

	getCurrentUser(request: FastifyRequest) {
		const user = User.getCurrent(this.db, request);
		return user ? user : null;
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

export default fastifyPlugin(async (app: FastifyInstance) => {
	const dbPath = process.env.DATABASE || "main.db";
	let sitePlugin = new SitePlugin(dbPath, app);
	app.decorate("db", sitePlugin.db);
	app.decorate("setOption", sitePlugin.setOption.bind(sitePlugin));
	app.decorate("getOption", sitePlugin.getOption.bind(sitePlugin));
});
