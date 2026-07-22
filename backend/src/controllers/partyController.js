const supabase = require("../config/supabase");
const RoomManager = require("../services/RoomManager");

// Keep an in-memory room's settings (used for live enforcement of playback
// permission / chat / links) in sync with whatever was just saved to the DB,
// and let anyone currently in the room see the change immediately instead
// of only after their next refresh or rejoin.
function syncLiveRoomSettings(req, code, party) {
    const io = req.app.get("io");
    if (!io) return;
    const settings = {
        chatEnabled: party.chat_enabled ?? true,
        allowLinks: party.allow_links ?? true,
        playbackPerm: party.playback_perm || "everyone",
    };
    RoomManager.setSettings(code, settings);
    io.to(code).emit("settings-updated", { settings });
}

// Detect which columns exist in parties table (cached after first call)
let _partyColumns = null;
async function getPartyColumns() {
    if (_partyColumns) return _partyColumns;
    const { data } = await supabase.from("parties").select("*").limit(1);
    if (data && data.length > 0) {
        _partyColumns = Object.keys(data[0]);
    } else {
        // Table is empty — try inserting a minimal row to detect columns
        // Fall back to minimal known columns
        _partyColumns = ["id", "code", "host_id", "created_at"];
    }
    return _partyColumns;
}

function buildInsert(cols, data) {
    const obj = {};
    for (const [k, v] of Object.entries(data)) {
        if (cols.includes(k)) obj[k] = v;
    }
    return obj;
}

exports.createParty = async (req, res) => {
    try {
        const hostId = req.user.id;
        const { title, privacy, videoUrl, description, language } = req.body;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const cols = await getPartyColumns();

        const fullData = {
            code,
            host_id: hostId,
            title: title || "Watch Party",
            privacy: privacy || "public",
            video_url: videoUrl || null,
            description: description || null,
            language: language || "English",
        };

        const insertData = buildInsert(cols, fullData);

        const { data, error } = await supabase
            .from("parties")
            .insert([insertData])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ message: "Failed to create party", error: error.message });
        }

        await supabase.from("party_members").insert([{ party_id: data.id, user_id: hostId }]);

        // Merge in fields that may not be in DB yet
        const party = {
            ...data,
            title: data.title || fullData.title,
            privacy: data.privacy || fullData.privacy,
            video_url: data.video_url || fullData.video_url,
            description: data.description || fullData.description,
            language: data.language || fullData.language,
        };

        res.json({ message: "Party created", party });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.joinParty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;

        const { data: party, error: partyError } = await supabase
            .from("parties")
            .select("*")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (partyError || !party)
            return res.status(404).json({ message: "Party not found" });

        const { data: existing } = await supabase
            .from("party_members")
            .select("id")
            .eq("party_id", party.id)
            .eq("user_id", userId)
            .maybeSingle();

        if (!existing)
            await supabase.from("party_members").insert([{ party_id: party.id, user_id: userId }]);

        res.json({ message: "Joined party successfully", party });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.leaveParty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { partyId } = req.body;
        await supabase.from("party_members").delete().eq("party_id", partyId).eq("user_id", userId);
        res.json({ message: "Left party successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getParty = async (req, res) => {
    try {
        const { code } = req.params;
        const { data: party, error } = await supabase
            .from("parties")
            .select("*")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (error || !party)
            return res.status(404).json({ message: "Party not found" });

        res.json({ party });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePartySettings = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;
        const { title, privacy, description, language, chatEnabled, allowLinks, playbackPerm } = req.body;

        const { data: party, error: findError } = await supabase
            .from("parties")
            .select("*")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (findError || !party)
            return res.status(404).json({ message: "Party not found" });

        if (party.host_id !== userId)
            return res.status(403).json({ message: "Only the host can update settings" });

        const cols = await getPartyColumns();
        const allUpdates = {
            title: title?.trim() || undefined,
            privacy: ["public", "private"].includes(privacy) ? privacy : undefined,
            description: description !== undefined ? description : undefined,
            language: language || undefined,
            chat_enabled: chatEnabled !== undefined ? chatEnabled : undefined,
            allow_links: allowLinks !== undefined ? allowLinks : undefined,
            playback_perm: ["host", "everyone"].includes(playbackPerm) ? playbackPerm : undefined,
        };

        const updates = {};
        for (const [k, v] of Object.entries(allUpdates)) {
            if (v !== undefined && cols.includes(k)) updates[k] = v;
        }

        if (Object.keys(updates).length === 0)
            return res.json({ message: "No updatable fields", party });

        const { data, error } = await supabase
            .from("parties")
            .update(updates)
            .eq("id", party.id)
            .select()
            .single();

        if (error) return res.status(400).json({ message: "Failed to update settings" });

        syncLiveRoomSettings(req, code.toUpperCase(), data);

        res.json({ message: "Settings updated", party: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPublicParties = async (req, res) => {
    try {
        const { language, search } = req.query;
        const cols = await getPartyColumns();
        const hasPrivacy = cols.includes("privacy");
        const hasTitle = cols.includes("title");

        let query = supabase
            .from("parties")
            .select("id, code, host_id, created_at" + (hasTitle ? ", title" : "") + (hasPrivacy ? ", privacy" : "") + (cols.includes("language") ? ", language" : "") + (cols.includes("video_url") ? ", video_url" : "") + (cols.includes("description") ? ", description" : ""))
            .order("created_at", { ascending: false })
            .limit(200);

        if (hasPrivacy) query = query.eq("privacy", "public");
        if (hasTitle && search) query = query.ilike("title", `%${search}%`);
        if (cols.includes("language") && language && language !== "All") query = query.eq("language", language);

        const { data, error } = await query;
        if (error) return res.status(400).json({ message: "Failed to fetch rooms", error: error.message });

        // A row existing in the DB doesn't mean anyone is actually watching —
        // RoomManager is the source of truth for who's live right now, so use
        // it to compute real user counts and only surface rooms that are
        // actually joinable at this moment.
        const rooms = (data || [])
            .map((party) => {
                const liveRoom = RoomManager.getRoom(party.code);
                const currentUsers = liveRoom ? liveRoom.users.size : 0;
                return { ...party, currentUsers, isLive: currentUsers > 0 };
            })
            .filter((r) => r.isLive)
            .sort((a, b) => b.currentUsers - a.currentUsers);

        res.json({ rooms });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteParty = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;

        const { data: party, error: findError } = await supabase
            .from("parties")
            .select("*")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (findError || !party)
            return res.status(404).json({ message: "Party not found" });

        if (party.host_id !== userId)
            return res.status(403).json({ message: "Only the host can delete the party" });

        await supabase.from("party_members").delete().eq("party_id", party.id);
        await supabase.from("chat_messages").delete().eq("party_id", party.id);
        await supabase.from("parties").delete().eq("id", party.id);

        res.json({ message: "Party deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
