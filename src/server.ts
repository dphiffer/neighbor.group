import dotenv from "dotenv";
import buildApp from "./app";

dotenv.config();
const host = process.env.HOST ? process.env.HOST : "0.0.0.0";
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = buildApp({
	logger: {
		transport: {
			target: "pino-pretty",
			options: {
				translateTime: "SYS:HH:MM:ss",
				ignore: "pid,hostname,reqId,responseTime,req,res",
				messageFormat: "{msg} {req.method} {req.url}",
			},
		},
	},
});
app.listen({
	host: host,
	port: port,
});

export default app;
