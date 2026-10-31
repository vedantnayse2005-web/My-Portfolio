const getEditingVideoPlatform = (value) => {
    if (typeof value !== "string" || !value.trim() || value.length > 2048) return "";

    let url;
    try {
        url = new URL(value.trim());
    } catch {
        return "";
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";

    const host = url.hostname.toLowerCase();
    if (["instagram.com", "www.instagram.com", "m.instagram.com"].includes(host)) {
        return /^\/(?:reel|p)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ? "instagram" : "";
    }
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return "hosted";
    if (host === "youtu.be" && /^[\w-]{6,}$/.test(url.pathname.split("/").filter(Boolean)[0] || "")) {
        return "youtube";
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
        const videoId = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})(?:\/|$)/)?.[1];
        return videoId ? "youtube" : "";
    }
    if ((host === "vimeo.com" || host.endsWith(".vimeo.com")) && /^\/(?:video\/)?\d+(?:\/|$)/.test(url.pathname)) {
        return "vimeo";
    }
    return "";
};

module.exports = { getEditingVideoPlatform };