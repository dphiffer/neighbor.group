import { Eta } from "eta";
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

export default function buildApp(options: AppOptions = {}) {
	const app = fastify(options);

	app.register(fastifyView, {
		engine: {
			eta: new Eta(),
		},
		root: path.join(path.dirname(__dirname), "src", "views"),
		layout: "layout.eta",
		defaultContext: {
			siteTitle: "neighbor.group",
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

	app.register(sitePlugin);
	app.register(siteRoutes);

	return app;
}
