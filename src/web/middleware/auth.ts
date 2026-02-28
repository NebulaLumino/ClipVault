import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";

export async function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers["x-api-key"] as string | undefined;
  const validApiKey = process.env.API_KEY;

  if (!apiKey) {
    reply.status(401).send({ error: "API key required" });
    return;
  }

  if (apiKey !== validApiKey) {
    reply.status(403).send({ error: "Invalid API key" });
    return;
  }
}

export async function discordBotAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const signature = request.headers["x-signature"] as string | undefined;
  const timestamp = request.headers["x-timestamp"] as string | undefined;

  if (!signature || !timestamp) {
    reply.status(401).send({ error: "Missing signature" });
    return;
  }

  const isValid = verifyDiscordSignature(request.body, signature, timestamp);
  if (!isValid) {
    reply.status(403).send({ error: "Invalid signature" });
    return;
  }
}

function verifyDiscordSignature(
  body: unknown,
  signature: string,
  timestamp: string,
): boolean {
  const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

  if (!DISCORD_PUBLIC_KEY) {
    return false;
  }

  const message = timestamp + JSON.stringify(body);
  const hmac = crypto.createHmac("sha256", DISCORD_PUBLIC_KEY);
  const digest = hmac.update(message).digest("hex");

  return signature === digest;
}
