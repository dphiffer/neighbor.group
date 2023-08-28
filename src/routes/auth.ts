import {
	FastifyInstance,
	FastifyRegisterOptions,
	FastifyRequest,
} from "fastify";
import { UserRow } from "../db/user";
import User from "../models/user";

interface AuthOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<AuthOptions>,
	done: () => void
) => {
	app.get("/signup", (request, reply) => {
		reply.view("signup.eta", {
			title: `Sign up - ${app.getOption("site.title", "neighbor.group")}`,
			redirect: "",
			name: "",
			email: "",
			slug: "",
			password: "",
			feedback: "",
			signupEnabled: true,
		});
	});

	app.post(
		"/signup",
		async (request: FastifyRequest<{ Body: UserRow }>, reply) => {
			try {
				// if (! app.site.signupEnabled) {
				// 	throw new Error('Sorry, you cannot sign up for a new account.');
				// }
				let user = await User.create(app.db, {
					id: BigInt(0),
					name: request.body.name,
					email: request.body.email,
					password: request.body.password,
				} as UserRow);
				app.log.info(
					`Created user '${user.data.email}' (${user.data.id})`
				);
				request.session.set("user.id", user.data.id);
				// if (!app.getOption('site.initialized')) {
				// 	app.setOption("site.initialized", 1);
				// 	return reply.redirect("/settings");
				// }
				return reply.redirect("/");
			} catch (err) {
				let feedback = "Error: something unexpected happened.";
				if (err instanceof Error) {
					feedback = err.message;
				}
				return reply.code(400).view("signup.eta", {
					feedback: feedback,
					name: request.body.name,
					email: request.body.email,
					password: request.body.password,
					signupEnabled: true,
				});
			}
		}
	);

	app.get("/login", (request, reply) => {
		reply.view("login.eta", {
			title: `Login - ${app.getOption("site.title", "neighbor.group")}`,
			redirect: "",
			email: "",
			password: "",
			feedback: "",
			signupEnabled: true,
		});
	});

	app.post(
		"/login",
		async (
			request: FastifyRequest<{
				Body: { email: string; password: string };
			}>,
			reply
		) => {
			try {
				let user = User.load(app.db, request.body.email);
				let valid = await user.checkPassword(request.body.password);
				if (valid) {
					request.session.set("user.id", user.data.id);
					return reply.redirect("/");
				}
			} catch (err) {}
			return reply.code(400).view("login.eta", {
				feedback: "Sorry, your login was incorrect.",
				email: request.body.email,
				password: request.body.password,
			});
		}
	);

	app.get("/logout", (request, reply) => {
		request.session.delete();
		reply.redirect("/login");
	});

	done();
};
