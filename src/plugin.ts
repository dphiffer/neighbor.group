import DatabaseConnection from "./db";
import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import fastifySecureSession from "@fastify/secure-session";
import sodium from "sodium-native";
import User from "./models/user";
import * as nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export class SitePlugin {
	db: DatabaseConnection;
	emailFrom: string | null = null;
	smtpTransport: nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> | null = null;

	constructor(dbPath: string, app?: FastifyInstance) {
		this.db = new DatabaseConnection(dbPath);
		if (app) {
			this.setupSessions(app);
			this.setupEmail(app);
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

	setupEmail(app: FastifyInstance) {
		this.emailFrom = process.env.EMAIL_FROM || null;
		this.smtpTransport = null;
		if (!process.env.SMTP_HOST || process.env.SMTP_HOST == 'xxxx' ||
			!process.env.SMTP_USER || process.env.SMTP_USER == 'xxxx' ||
			!process.env.SMTP_PASS || process.env.SMTP_PASS == 'xxxx') {
			return;
		} else {
			this.smtpTransport = nodemailer.createTransport({
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
				secure: (process.env.SMTP_SECURE == "true"),
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			});
		}
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

	sendMail(to: string, subject: string, html: string) {
		if (this.emailFrom && this.smtpTransport) {
			const message = {
				from: this.emailFrom,
				to: to,
				subject: subject,
				html: html
			};
			this.smtpTransport.sendMail(message, (error, _) => {
				if (error) {
					console.error(error);
					throw new Error('Error sending email.');
				}
			});
			return true;
		} else {
			throw new Error('Sorry this website isn’t configured to send email yet.');
		}
	}
}

export function getDatabasePath() {
	return process.env.DATABASE || "main.db";
}

export default fastifyPlugin(async (app: FastifyInstance) => {
	const dbPath = getDatabasePath();
	const sitePlugin = new SitePlugin(dbPath, app);
	app.decorate("db", sitePlugin.db);
	app.decorate("setOption", sitePlugin.setOption.bind(sitePlugin));
	app.decorate("getOption", sitePlugin.getOption.bind(sitePlugin));
	app.decorate("sendMail", sitePlugin.sendMail.bind(sitePlugin));
	app.decorateRequest("user", null);
});
