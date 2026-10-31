const getParsedUrl = (value) => {
    if (typeof value !== "string" || !value.trim() || value.length > 2048) return null;
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch {
        return null;
    }
};

const getInstagramPath = (url) => {
    const match = url.pathname.match(/^\/(reel|p)\/([A-Za-z0-9_-]+)\/?$/);
    return match ? { type: match[1], shortcode: match[2] } : null;
};

export const getVideoPlatform = (value) => {
    const url = getParsedUrl(value);
    if (!url) return "";

    const host = url.hostname.toLowerCase();
    if (["instagram.com", "www.instagram.com", "m.instagram.com"].includes(host)) {
        return getInstagramPath(url) ? "instagram" : "";
    }
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return "hosted";
    if (host === "youtu.be" && /^[\w-]{6,}$/.test(url.pathname.split("/").filter(Boolean)[0] || "")) return "youtube";
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
        const videoId = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})(?:\/|$)/)?.[1];
        return videoId ? "youtube" : "";
    }
    if ((host === "vimeo.com" || host.endsWith(".vimeo.com")) && /^\/(?:video\/)?\d+(?:\/|$)/.test(url.pathname)) return "vimeo";
    return "";
};

export const isValidVideoUrl = (value) => Boolean(getVideoPlatform(value));

export const getVideoEmbedUrl = (value) => {
    const url = getParsedUrl(value);
    if (!url) return "";

    const platform = getVideoPlatform(value);
    if (platform === "instagram") {
        const instagramPath = getInstagramPath(url);
        return instagramPath
            ? `https://www.instagram.com/${instagramPath.type}/${instagramPath.shortcode}/embed/`
            : "";
    }
    if (platform === "youtube") {
        const videoId = url.hostname === "youtu.be"
            ? url.pathname.split("/").filter(Boolean)[0]
            : url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})(?:\/|$)/)?.[1];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
    }
    if (platform === "vimeo") {
        const videoId = url.pathname.split("/").filter(Boolean).at(-1);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
    }
    return "";
};

export const isHostedVideoUrl = (value) => getVideoPlatform(value) === "hosted";