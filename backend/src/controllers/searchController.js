const https = require("https");

// Uses YouTube's public suggest/search endpoint (no API key needed for basic search)
// Falls back gracefully if unavailable
exports.searchYouTube = async (req, res) => {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ message: "Query required" });

    const query = encodeURIComponent(q.trim());

    // Use YouTube's internal search suggestion + oEmbed for metadata
    // We use the YouTube search page scrape-free approach via RSS/Atom feed
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?search_query=${query}`;

    const fetchFeed = () => new Promise((resolve, reject) => {
        https.get(feedUrl, { headers: { "User-Agent": "CoView/1.0" } }, (response) => {
            let data = "";
            response.on("data", chunk => data += chunk);
            response.on("end", () => resolve(data));
        }).on("error", reject);
    });

    try {
        const xml = await fetchFeed();

        // Parse video entries from XML
        const entries = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;

        while ((match = entryRegex.exec(xml)) !== null && entries.length < 12) {
            const entry = match[1];
            const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
            const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1];
            const author = (entry.match(/<name>(.*?)<\/name>/) || [])[1];
            const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1];

            if (videoId && title) {
                entries.push({
                    videoId,
                    title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
                    author: author || "Unknown",
                    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    published: published || null,
                });
            }
        }

        res.json({ results: entries, query: q.trim() });
    } catch (err) {
        // Fallback: return empty results gracefully
        res.json({ results: [], query: q.trim(), error: "Search temporarily unavailable" });
    }
};
