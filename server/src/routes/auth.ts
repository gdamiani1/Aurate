import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (request, reply) => {
    const { email, password, username, display_name } = request.body as {
      email: string; password: string; username: string; display_name?: string;
    };

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authError) return reply.status(400).send({ error: authError.message });

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id, username, display_name: display_name || username,
    });
    if (profileError) return reply.status(400).send({ error: profileError.message });

    return { message: "Account created. Your aura origin story begins now.", user_id: authData.user.id };
  });

  app.post("/auth/signin", async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return reply.status(401).send({ error: "L. Wrong credentials detected." });
    return { session: data.session, user: data.user };
  });
}
