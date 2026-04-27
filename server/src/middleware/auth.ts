import { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "../lib/supabase";

export interface AuthedRequest extends FastifyRequest {
  userId?: string;
  unlimitedChecks?: boolean;
  moderationOverride?: boolean;
}

/**
 * Verifies the Supabase JWT from the Authorization header.
 * On success, attaches userId and unlimitedChecks to the request.
 * On failure, returns 401.
 */
export async function requireAuth(
  request: AuthedRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({ error: "No auth token. Who even are you bro." });
    return;
  }

  const token = authHeader.slice(7);

  // Verify the JWT with Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    reply.status(401).send({ error: "Invalid or expired token. Sign in again fr." });
    return;
  }

  request.userId = data.user.id;

  // Look up flags from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("unlimited_checks, moderation_override")
    .eq("id", data.user.id)
    .single();

  request.unlimitedChecks = profile?.unlimited_checks === true;
  request.moderationOverride = profile?.moderation_override === true;
}
