import Fastify from "fastify";

export default function buildApp() {
	const app = Fastify({
		logger: true,
	});
	app.all("/_health-check", (req, reply) => {
		reply.send({
			ok: true,
			message: "I'm not dead",
		});
	});
	return app;
}
