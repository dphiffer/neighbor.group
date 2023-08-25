import buildApp from "./app";

const app = buildApp();

let host = process.env.HOST ? process.env.HOST : "0.0.0.0";
let port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen({
	host: host,
	port: port,
});

export default app;
