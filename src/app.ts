import { Eta } from "eta";
import fastify from "fastify";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import path from "path";
import { PinoLoggerOptions } from "fastify/types/logger";

export type AppOptions = {
	logger?: boolean | PinoLoggerOptions;
};

export default function buildApp(options: AppOptions = {}) {
	const app = fastify(options);

	app.register(fastifyView, {
		engine: {
			eta: new Eta(),
		},
		includeViewExtension: false,
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

	app.all("/", (_, reply) => {
		reply.view("index.eta", {
			title: "neighbor.group",
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
