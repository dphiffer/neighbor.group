import {
	FastifyInstance,
	FastifyRequest,
	FastifyRegisterOptions,
} from "fastify";
import MessageModel from "../models/message";
import GroupModel from "../models/group";
import { MessageRow } from "../db/message";

interface MessageOptions {}

export default (
	app: FastifyInstance,
	_: FastifyRegisterOptions<MessageOptions>,
	done: () => void
) => {
	
	done();
};