import {
	FastifyInstance,
	FastifyRequest,
	FastifyRegisterOptions,
} from "fastify";
import GroupModel from "../models/group";
import { GroupsRow } from "../db/groups";

interface GroupOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<GroupOptions>,
	done: () => void
) => {
	app.get("/new", (request, reply) => {
		if (!request.user) {
			return reply.redirect("/login?redirect=/new");
		}
		reply.view("group/new.njk");
	});

	app.post('/new', async (request: FastifyRequest<{ Body: GroupsRow }>, reply) => {
		try {
			const group = await GroupModel.create(app.db, request.body);
			return reply.redirect(`/${group.data.slug}`);
		} catch (err) {
			let feedback = "Error: something unexpected happened.";
			if (err instanceof Error) {
				feedback = err.message;
			}
			console.error(err);
			return reply.code(400).view("group/new.njk", {
				feedback: feedback,
				name: request.body.name,
				description: request.body.description,
				slug: request.body.slug,
			});
		}
	});

	app.get('/:group', (request: FastifyRequest<{
		Params: { group: string };
	}>, reply) => {
		try {
			const group = GroupModel.load(app.db, request.params.group);
			return reply.view('group/index.njk', {
				title: group.data.name,
				group: group
			});
		} catch (err) {
			return reply.code(404).view("404.njk");
		}
	});

	done();
};