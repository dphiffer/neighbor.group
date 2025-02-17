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
				User.checkAuthErrors(app.db, request.ip, 'signup'); // throws on too many signup errors
				let user = await User.create(app.db, {
					id: 0,
					name: request.body.name,
					email: request.body.email,
					password: request.body.password,
				} as UserRow);
				request.session.set("user.id", user.data.id);
				User.authLog(app.db, request.ip, 'signup', `Signup: ${request.body.name} <${request.body.email}> (${user.data.id})`);
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
				User.authLog(app.db, request.ip, 'signup error', `Signup error: ${request.body.name} <${request.body.email}>`);
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
			let feedback = 'Sorry, your login was incorrect.';
			try {
				User.checkAuthErrors(app.db, request.ip, 'login'); // throws on too many login errors
				let user = User.load(app.db, request.body.email);
				let valid = await user.checkPassword(request.body.password);
				if (valid) {
					request.session.set("user.id", user.data.id);
					User.authLog(app.db, request.ip, 'login', `Login: ${user.data.email}`);
					return reply.redirect("/");
				}
			} catch (err) {
				if (err instanceof Error) {
					feedback = err.message;
				}
			}
			User.authLog(app.db, request.ip, 'login error', `Login error: ${request.body.email}`);
			return reply.code(400).view("login.eta", {
				title: `Login - ${app.getOption("site.title", "neighbor.group")}`,
				feedback: feedback,
				email: request.body.email,
				password: request.body.password,
			});
		}
	);

	app.get("/logout", (request, reply) => {
		if (request.user) {
			User.authLog(app.db, request.ip, 'logout', `Logout: ${request.user.data.email}`);
			request.session.delete();
		}
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
		let id, code;
		try {
			User.checkAuthErrors(app.db, request.ip, 'password reset'); // throws on too many password reset errors
			if (request.body.email == '') {
				throw new Error('Please enter an email address.');
			}
			if (request.body.email.indexOf('@') == -1) {
				throw new Error('Please enter a valid email address.');
			}
			let user = User.load(app.db, request.body.email);
			[id, code] = user.resetPassword();
			User.authLog(app.db, request.ip, 'password reset start', `Password reset start: ${request.body.email}`);
			app.sendMail(request.body.email, 'neighbor.group password reset', `Your password reset code is: <b>${code}</b>`);
		} catch (err) {
			let feedback = "Error: something unexpected happened.";
			if (err instanceof Error) {
				feedback = err.message;
			}
			User.authLog(app.db, request.ip, 'password reset error', `Password reset error: ${request.body.email}`);
			return reply.code(400).view("password.eta", {
				title: `Password Reset - ${app.getOption(
					"site.title",
					"neighbor.group"
				)}`,
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
				User.checkAuthErrors(app.db, request.ip, 'password reset'); // throws on too many password reset errors
				const user = User.verifyPasswordReset(app.db, request.params.id, request.body.code);
				request.session.set("user.id", user.data.id);
				User.authLog(app.db, request.ip, 'password reset code verified', `Password reset code verified: ${user.data.email}`);
				return reply.redirect(`/password/reset`);
			} catch (err) {
				User.authLog(app.db, request.ip, 'password reset error', `Password reset code error: ${request.body.code}`);
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
			User.authLog(app.db, request.ip, 'password reset error', 'Password reset error (user not found).');
			return reply.code(400).view("passwordDone.eta", {
				feedback: 'Sorry, your password cannot be reset.',
				title: `Password Reset - ${app.getOption(
					"site.title",
					"neighbor.group"
				)}`,
			});
		}
		try {
			User.checkAuthErrors(app.db, request.ip, 'password reset'); // throws on too many password reset errors
			if (request.body.password !== request.body.password2) {
				throw new Error('Sorry, your passwords did not match.');
			}
			User.validatePassword(request.body.password);
			await request.user.setPassword(request.body.password);
			User.authLog(app.db, request.ip, 'password reset success', `Password reset success: ${request.user.data.email}`);
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
			User.authLog(app.db, request.ip, 'password reset error', `Password reset error (${feedback}): ${request.user.data.email}`);
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
