import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import authRoutes from "./auth";
import groupRoutes from "./group";
import messageRoutes from "./message";
import GroupModel from "../models/group";

interface IndexOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<IndexOptions>,
	done: () => void
) => {
	app.all("/", (_, reply) => {
		reply.view("home.njk", {
			title: app.getOption("site.title", "neighbor.group"),
			intro: app.getOption(
				"site.intro",
				"A website for local groups."
			),
			groups: GroupModel.all(app.db),
		});
	});

	app.all("/_health-check", (req, reply) => {
		reply.send({
			ok: true,
			message: "I'm not dead",
		});
	});

	app.register(authRoutes);
	app.register(groupRoutes);
	app.register(messageRoutes);

	done();
};
