import {
	FastifyInstance,
	FastifyRequest,
	FastifyRegisterOptions,
} from "fastify";
import MessageModel from "../models/message";
import GroupModel from "../models/group";
import { MessageRow } from "../db/message";

interface MessageOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<MessageOptions>,
	done: () => void
) => {
	app.post('/:group/post', (request: FastifyRequest<{
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