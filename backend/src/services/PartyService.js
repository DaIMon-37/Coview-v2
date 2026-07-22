const supabase = require("../config/supabase");

class PartyService {
    static async getPartyByCode(code) {
        const { data, error } = await supabase
            .from("parties")
            .select("*")
            .eq("code", code)
            .single();

        if (error) throw error;
        return data;
    }

    static async getPartyId(code) {
        const party = await this.getPartyByCode(code);
        return party.id;
    }
}

module.exports = PartyService;
