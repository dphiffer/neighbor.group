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
		if (request.user) {
			return reply.redirect("/");
		}
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
					id: 0,
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
		if (request.user) {
			return reply.redirect("/");
		}
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

	app.get("/password", (request, reply) => {
		return reply.view("password.eta", {
			title: `Password Reset - ${app.getOption(
				"site.title",
				"neighbor.group",
			)}`,
			feedback: "",
			email: "",
		});
	});

	app.post("/password", async (
		request: FastifyRequest<{
			Body: { email: string };
		}>,
		reply
	) => {
		let id;
		try {
			if (request.body.email == '') {
				throw new Error('Please enter an email address.');
			}
			if (request.body.email.indexOf('@') == -1) {
				throw new Error('Please enter a valid email address.');
			}
			let user = User.load(app.db, request.body.email);
			id = user.resetPassword();
		} catch (err) {
			let feedback = "Error: something unexpected happened.";
			if (err instanceof Error) {
				feedback = err.message;
			}
			return reply.code(400).view("password.eta", {
				feedback: feedback,
				email: request.body.email
			});
		}
		return reply.redirect(`/password/${id}`);
	});

	app.get("/password/:id", (request: FastifyRequest<{
			Params: { id: string };
		}>, reply) => {
		if (request.user) {
			return reply.redirect("/password/reset");
		}
		return reply.view("passwordVerify.eta", {
			id: request.params.id,
			feedback: 'Please check your email for a verification code.',
			title: `Password Reset - ${app.getOption(
				"site.title",
				"neighbor.group"
			)}`,
		});
	});

	app.post("/password/:id", (request: FastifyRequest<{
			Params: { id: string };
			Body: { code: string };
		}>, reply) => {
			try {
				const user = User.verifyPasswordReset(app.db, request.params.id, request.body.code);
				app.db.passwordReset.update(request.params.id, {
					status: 'claimed',
				});
				request.session.set("user.id", user.data.id);
				return reply.redirect(`/password/reset`);
			} catch (err) {
				return reply.code(400).view("passwordVerify.eta", {
					id: request.params.id,
					title: `Password Reset - ${app.getOption(
						"site.title",
						"neighbor.group"
					)}`,
					feedback: "Sorry, your password reset code was invalid."
				});
			}
	});

	app.get("/password/reset", (request, reply) => {
		if (!request.user) {
			return reply.redirect("/password");
		}
		return reply.view("passwordReset.eta", {
			feedback: '',
			title: `Password Reset - ${app.getOption(
				"site.title",
				"neighbor.group"
			)}`,
		});
	});

	app.post("/password/reset", async (request: FastifyRequest<{
		Body: {
			password: string,
			password2: string
		};
	}>, reply) => {
		let response;
		if (!request.user) {
			return reply.view("passwordDone.eta", {
				feedback: 'Sorry, there was a problem loading your user. Your password cannot be reset.',
				title: `Password Reset - ${app.getOption(
					"site.title",
					"neighbor.group"
				)}`,
			});
		}
		try {
			if (request.body.password !== request.body.password2) {
				throw new Error('Sorry, your passwords did not match.');
			}
			User.validatePassword(request.body.password);
			await request.user.setPassword(request.body.password);
			return reply.view("passwordDone.eta", {
				feedback: 'Success! Your password has been reset.',
				title: `Password Reset - ${app.getOption(
					"site.title",
					"neighbor.group"
				)}`,
			});
		} catch (err) {
			let feedback = 'There was a problem with the passwords you entered, please try again.';
			if (err instanceof Error) {
				feedback = err.message;
			}
			return reply.code(400).view("passwordReset.eta", {
				feedback: feedback,
				title: `Password Reset - ${app.getOption(
					"site.title",
					"neighbor.group"
				)}`,
			});
		}
	});

	done();
};
