import DatabaseConnection from "./db";
import fastifyPlugin from "fastify-plugin";
import { FastifyInstance } from "fastify";

export class Site {
	db: DatabaseConnection;
	constructor(dbPath_: string | null = null) {
		const dbPath = dbPath_ || process.env.DATABASE || "main.db";
		this.db = new DatabaseConnection(dbPath);
	}

	getOption(key: string, defaultValue: string = "") {
		let option = this.db.option.select(key);
		if (option) {
			return option.value;
		} else {
			return defaultValue;
		}
	}

	setOption(key: string, value: string) {
		let option = this.db.option.select(key);
		if (option) {
			this.db.option.update(key, value);
		} else {
			this.db.option.insert(key, value);
		}
	}
}

export default fastifyPlugin(async (app: FastifyInstance) => {
	let site = new Site();
	app.decorate("setOption", site.setOption.bind(site));
	app.decorate("getOption", site.getOption.bind(site));
});
