import { Eta } from "eta";
import fastify, { FastifyInstance } from "fastify";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import { Server, IncomingMessage, ServerResponse } from "http";
import path from "path";
import { PinoLoggerOptions } from "fastify/types/logger";
import sitePlugin from "./site";

export type AppOptions = {
	logger?: boolean | PinoLoggerOptions;
};

export default function buildApp(options: AppOptions = {}) {
	const app: FastifyInstance<Server, IncomingMessage, ServerResponse> =
		fastify(options);

	app.register(fastifyView, {
		engine: {
			eta: new Eta(),
		},
		root: path.join(path.dirname(__dirname), "src", "views"),
		layout: "layout.eta",
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

	app.register(sitePlugin);

	app.all("/", (_, reply) => {
		reply.view("index.eta", {
			title: app.getOption("site.title", "neighbor.group"),
		});
	});

	app.all("/_health-check", (req, reply) => {
		reply.send({
			ok: true,
			message: "I'm not dead",
		});
	});

	return app;
}
