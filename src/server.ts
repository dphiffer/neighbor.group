import dotenv from "dotenv";
import buildApp from "./app";

dotenv.config();
let host = process.env.HOST ? process.env.HOST : "0.0.0.0";
let port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = buildApp();
app.listen({
	host: host,
	port: port,
});

export default app;
