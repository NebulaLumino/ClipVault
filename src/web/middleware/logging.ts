import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "../../utils/logger.js";

export async function requestLogger(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const start = Date.now();

  reply.raw.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP request", {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
    });
  });
}

export function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  logger.error("Request error", {
    method: request.method,
    url: request.url,
    error: error.message,
    stack: error.stack,
  });

  reply.status(500).send({
    error: "Internal Server Error",
    message: error.message,
  });
}
