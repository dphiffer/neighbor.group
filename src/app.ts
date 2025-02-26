import nunjucks from "nunjucks";
import fastify, { FastifyInstance } from "fastify";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import path from "path";
import { PinoLoggerOptions } from "fastify/types/logger";
import sitePlugin from "./plugin";
import siteRoutes from "./routes/index";

export type AppOptions = {
	logger?: boolean | PinoLoggerOptions;
};

export default async function buildApp(options: AppOptions = {}) {
	const app = fastify(options);

	await app.register(sitePlugin);

	nunjucks.configure('views', {
		autoescape: true
	});

	app.register(fastifyView, {
		engine: {
			nunjucks: nunjucks
		},
		root: path.join(path.dirname(__dirname), "src", "views"),
		defaultContext: {
			siteTitle: app.getOption("site.title", "neighbor.group"),
		},
	});

	app.register(fastifyStatic, {
		root: path.join(path.dirname(__dirname), "static"),
		prefix: "/static",
	});

	app.register(fastifyStatic, {
		root: path.join(path.dirname(__dirname), "dist"),
		prefix: "/dist",
		decorateReply: false,
	});

	app.register(fastifyFormbody);

	await app.register(siteRoutes);

	return app;
}
