import DatabaseConnection from "../db";
import User from "../models/user";

// https://medium.com/sharenowtech/fastify-with-typescript-production-ready-integration-2303318ecd9e

declare module "fastify" {
	export interface FastifyInstance {
		db: DatabaseConnection;
		setOption(key: string, value: string): void;
		getOption(key: string, defaultValue?: string | null): string;
	}
	export interface FastifyReply {
		locals: { user: User | null };
	}
}
