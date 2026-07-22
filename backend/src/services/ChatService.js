const supabase = require("../config/supabase");

class ChatService {
    async saveMessage({ partyId, userId, message }) {
        const { data, error } = await supabase
            .from("chat_messages")
            .insert([{ party_id: partyId, user_id: userId, message }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async getMessages(partyId) {
        const { data, error } = await supabase
            .from("chat_messages")
            .select("id, message, created_at, user_id, users ( username )")
            .eq("party_id", partyId)
            .order("created_at", { ascending: true });
        if (error) throw error;
        return data;
    }

    async deleteMessage(messageId, userId) {
        const { data: msg, error: findErr } = await supabase
            .from("chat_messages")
            .select("id, user_id")
            .eq("id", messageId)
            .maybeSingle();

        if (findErr || !msg) { const e = new Error("Message not found"); e.status = 404; throw e; }
        if (msg.user_id !== userId) { const e = new Error("Not authorized"); e.status = 403; throw e; }

        const { error } = await supabase.from("chat_messages").delete().eq("id", messageId);
        if (error) throw error;
    }

    async getUserWatchHistory(userId) {
        // Get parties the user has been a member of
        const { data, error } = await supabase
            .from("party_members")
            .select("joined_at, party_id, parties ( id, code, host_id, created_at )")
            .eq("user_id", userId)
            .order("joined_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map(row => ({
            id: row.parties?.id,
            code: row.parties?.code,
            title: row.parties?.title || `Room ${row.parties?.code || ""}`,
            video_url: row.parties?.video_url || null,
            language: row.parties?.language || "English",
            created_at: row.parties?.created_at,
            joinedAt: row.joined_at,
            host: "Host",
        })).filter(r => r.id);
    }
}

module.exports = new ChatService();
