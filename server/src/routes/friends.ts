import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";

export async function friendRoutes(app: FastifyInstance) {
  // Link Up (send friend request)
  app.post("/circle/link", async (request, reply) => {
    const { requester_id, addressee_username } = request.body as {
      requester_id: string;
      addressee_username: string;
    };
    const { data: addressee } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", addressee_username)
      .single();
    if (!addressee)
      return reply
        .status(404)
        .send({ error: "User not found. That username doesn't exist fr" });

    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id, addressee_id: addressee.id });
    if (error)
      return reply
        .status(400)
        .send({ error: "Already in your circle or request pending" });
    return { message: "Link up request sent. W." };
  });

  // Accept / reject
  app.patch("/circle/respond", async (request, reply) => {
    const { friendship_id, action } = request.body as {
      friendship_id: string;
      action: "accepted" | "blocked";
    };
    const { error } = await supabase
      .from("friendships")
      .update({ status: action })
      .eq("id", friendship_id);
    if (error)
      return reply.status(400).send({ error: "Failed to update. Try again." });
    return {
      message:
        action === "accepted"
          ? "Linked up. W secured."
          : "Blocked. They can't see your aura anymore.",
    };
  });

  // Get your circle
  app.get("/circle/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const { data } = await supabase
      .from("friendships")
      .select(
        "id, status, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url, peak_aura, tier), addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url, peak_aura, tier)"
      )
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    const friends = (data || []).map((f: any) => {
      const friend =
        f.requester.id === userId ? f.addressee : f.requester;
      return { friendship_id: f.id, ...friend };
    });
    return { circle: friends };
  });

  // Pending requests
  app.get("/circle/pending/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const { data } = await supabase
      .from("friendships")
      .select(
        "id, requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)"
      )
      .eq("addressee_id", userId)
      .eq("status", "pending");
    return { pending: data || [] };
  });
}
