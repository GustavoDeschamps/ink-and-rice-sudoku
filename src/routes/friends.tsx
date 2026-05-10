import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
  head: () => ({ meta: [{ title: "数独 — Friends" }] }),
});

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  friend?: { username: string | null };
}

function FriendsPage() {
  const { user, loading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    const rows = (data ?? []) as Friend[];
    const otherIds = rows.map((r) => (r.user_id === user.id ? r.friend_id : r.user_id));
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("id, username").in("id", otherIds)
      : { data: [] as { id: string; username: string | null }[] };
    const map = new Map((profs ?? []).map((p) => [p.id, p.username]));
    const enriched = rows.map((r) => {
      const otherId = r.user_id === user.id ? r.friend_id : r.user_id;
      return { ...r, friend: { username: map.get(otherId) ?? null } };
    });
    setFriends(enriched.filter((r) => r.status === "accepted"));
    setPending(enriched.filter((r) => r.status === "pending" && r.friend_id === user.id));
  };

  useEffect(() => {
    load();
  }, [user]);

  if (loading) return <div className="container py-20 text-center">…</div>;
  if (!user)
    return (
      <div className="container mx-auto py-20 text-center">
        Sign in to manage friends. <Link to="/auth" className="text-vermillion underline">Sign in</Link>
      </div>
    );

  const sendRequest = async () => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", search.trim())
      .maybeSingle();
    if (!prof) return toast.error("User not found");
    if (prof.id === user.id) return toast.error("That's you!");
    const { error } = await supabase
      .from("friendships")
      .insert({ user_id: user.id, friend_id: prof.id, status: "pending" });
    if (error) return toast.error(error.message);
    toast.success("Request sent");
    setSearch("");
    load();
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friendships").delete().eq("id", id);
    }
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="font-display text-3xl text-vermillion text-center">友達</h1>
      <p className="text-center text-muted-foreground text-sm mb-6">Tomodachi — friends</p>

      <Card className="p-4 bg-paper flex gap-2">
        <Input
          placeholder="Find by username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={sendRequest} disabled={!search.trim()} className="bg-vermillion hover:bg-vermillion/90">
          Add
        </Button>
      </Card>

      {pending.length > 0 && (
        <>
          <h2 className="font-display text-lg mt-6 mb-2">Pending</h2>
          <div className="space-y-2">
            {pending.map((f) => (
              <Card key={f.id} className="px-4 py-3 flex justify-between items-center bg-paper">
                <span>{f.friend?.username ?? "unknown"}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respond(f.id, true)}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => respond(f.id, false)}>Decline</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="font-display text-lg mt-6 mb-2">Your friends</h2>
      <div className="space-y-2">
        {friends.length === 0 && <p className="text-sm text-muted-foreground">No friends yet.</p>}
        {friends.map((f) => (
          <Card key={f.id} className="px-4 py-3 bg-paper">
            {f.friend?.username ?? "unknown"}
          </Card>
        ))}
      </div>
    </div>
  );
}
