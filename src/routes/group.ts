import {
	FastifyInstance,
	FastifyRequest,
	FastifyRegisterOptions,
} from "fastify";
import GroupModel from "../models/group";
import MessageModel from "../models/message";
import { GroupsRow } from "../db/groups";

interface GroupOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<GroupOptions>,
	done: () => void
) => {
	app.get("/new", (request, reply) => {
		if (!request.user) {
			let redirect = encodeURIComponent('/new');
			return reply.redirect(`/login?redirect=${redirect}`);
		}
		reply.view("group/new.njk");
	});

	app.post('/new', (request: FastifyRequest<{ Body: GroupsRow }>, reply) => {
		try {
			const group = GroupModel.create(app.db, request.body);
			return reply.redirect(`/${group.data.slug}`);
		} catch (err) {
			let feedback = "Error: something unexpected happened.";
			if (err instanceof Error) {
				feedback = err.message;
			}
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
			if (!request.user) {
				let redirect = encodeURIComponent(`/${request.params.group}`);
				reply.redirect(`/login?redirect=${redirect}`);
			}
			const group = GroupModel.load(app.db, request.params.group);
			const messages = MessageModel.query(app.db, group.data.id);
			return reply.view('group/index.njk', {
				title: group.data.name,
				group: group,
				messages: messages
			});
		} catch (err) {
			let feedback = "Sorry, the page you’re looking for isn’t available.";
			if (err instanceof Error) {
				feedback = err.message;
			}
			return reply.code(404).view("error.njk", {
				status: 404,
				feedback: feedback
			});
		}
	});

	app.post('/:group', (request: FastifyRequest<{
		Params: {
			group: string
		},
		Body: {
			message: string
		}
	}>, reply) => {
		try {
			if (!request.user) {
				throw new Error('You must be signed in to post a message.');
			}
			const group = GroupModel.load(app.db, request.params.group);
			if (!group) {
				throw new Error(`Could not find group '${request.params.group}'.`);
			}
			if (!request.body.message) {
				throw new Error('Please include a message to post.');
			}
			MessageModel.create(app.db, {
				id: 0,
				group_id: group.data.id,
				user_id: request.user.data.id,
				message: request.body.message,
			});
			return reply.redirect(`/${group.data.slug}`);
		} catch (err) {
			let feedback = "Error: something unexpected happened.";
			if (err instanceof Error) {
				feedback = err.message;
			}
			return reply.code(500).view("error.njk", {
				status: 500,
				feedback: feedback
			});
		}
	});

	done();
};