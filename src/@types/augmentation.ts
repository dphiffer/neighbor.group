import Site from "../site";

declare module "fastify" {
	export interface FastifyInstance {
		setOption(key: string, value: string): void;
		getOption(key: string, defaultValue?: string | null): void;
	}
}
