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
			if (!request.user) {
				return reply.status(401).view('error.njk', {
					status: 401,
					feedback: 'Sorry you are not authorized to create a new group.',
				});
			}
			const group = GroupModel.create(app.db, request.body);
			group.addMember(app.db, request.user.data.id);
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
				return reply.redirect(`/login?redirect=${redirect}`);
			}
			const group = GroupModel.load(app.db, request.params.group);
			if (!group.hasMember(app.db, request.user.data.id)) {
				let redirect = encodeURIComponent(`/${request.params.group}`);
				return reply.code(403).view('group/join.njk', {
					group: group
				});
			}
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
			let status = 500;
			let feedback = "Something unexpected happened.";
			if (err instanceof Error) {
				status = 400;
				feedback = err.message;
				if (feedback.substring(0, 20) == 'Could not find group') {
					status = 404;
				}
			}
			return reply.code(status).view("error.njk", {
				status: status,
				feedback: feedback
			});
		}
	});

	app.get('/:group/join', (request: FastifyRequest<{
		Params: {
			group: string
		}
	}>, reply) => {
		const group = GroupModel.load(app.db, request.params.group);
		if (!group) {
			return reply.code(404).view("error.njk", {
				status: 404,
				feedback: 'Page not found.'
			});
		}
		return reply.view('group/join.njk', {
			group: group,
		});
	});

	app.post('/:group/join', (request: FastifyRequest<{
		Params: {
			group: string
		}
	}>, reply) => {
		try {
			if (!request.user) {
				throw new Error('You must be signed in to join group.');
			}
			const group = GroupModel.load(app.db, request.params.group);
			if (!group.hasMember(app.db, request.user.data.id)) {
				group.addMember(app.db, request.user.data.id);
			}
			return reply.redirect(`/${group.data.slug}`);
		} catch (err) {
			let status = 500;
			let feedback = "Something unexpected happened.";
			if (err instanceof Error) {
				status = 400;
				feedback = err.message;
				if (feedback == 'You must be signed in to join group.') {
					status = 401;
				}
			}
			return reply.code(status).view("error.njk", {
				status: status,
				feedback: feedback
			});
		}
	});

	app.get('/:group/leave', (request: FastifyRequest<{
		Params: {
			group: string
		}
	}>, reply) => {
		const group = GroupModel.load(app.db, request.params.group);
		if (!group) {
			return reply.code(404).view("error.njk", {
				status: 404,
				feedback: 'Page not found.'
			});
		}
		return reply.view('group/leave.njk', {
			group: group,
		});
	});

	app.post('/:group/leave', (request: FastifyRequest<{
		Params: {
			group: string
		}
	}>, reply) => {
		try {
			if (!request.user) {
				throw new Error('You must be signed in to leave group.');
			}
			const group = GroupModel.load(app.db, request.params.group);
			if (group.hasMember(app.db, request.user.data.id)) {
				group.removeMember(app.db, request.user.data.id);
			}
			return reply.redirect('/');
		} catch (err) {
			let status = 500;
			let feedback = "Something unexpected happened.";
			if (err instanceof Error) {
				status = 400;
				feedback = err.message;
				if (feedback == 'You must be signed in to leave group.') {
					status = 401;
				}
			}
			return reply.code(status).view("error.njk", {
				status: status,
				feedback: feedback
			});
		}
	});

	done();
};