import API_BASE_URL from "../../../config/api";

export const editingAdminRequest = async (path, token, options = {}) => {
    const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
        Authorization: `Bearer ${token}`
    };
    const response = await fetch(`${API_BASE_URL}/api/editing${path}`, {
        ...options,
        headers
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(result.message || "Editing portfolio request failed.");
        error.status = response.status;
        throw error;
    }
    return result;
};

export const handleEditingAdminError = (error, navigate) => {
    if (error.status !== 401) return false;
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login");
    return true;
};

export const isValidVideoUrl = (value) => {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") return false;
        if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) return true;
        if (url.hostname === "youtu.be") return /^[\w-]{6,}$/.test(url.pathname.split("/").filter(Boolean)[0] || "");
        if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) {
            return Boolean(url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})(?:\/|$)/));
        }
        if (url.hostname === "vimeo.com" || url.hostname.endsWith(".vimeo.com")) {
            return /^\/(?:video\/)?\d+(?:\/|$)/.test(url.pathname);
        }
        return false;
    } catch {
        return false;
    }
};

export const getVideoEmbedUrl = (value) => {
    try {
        const url = new URL(value);
        if (url.hostname === "youtu.be") {
            return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
        }
        if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) {
            const videoId = url.searchParams.get("v");
            return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
        }
        if (url.hostname === "vimeo.com" || url.hostname.endsWith(".vimeo.com")) {
            const videoId = url.pathname.split("/").filter(Boolean).at(-1);
            return videoId && /^\d+$/.test(videoId) ? `https://player.vimeo.com/video/${videoId}` : "";
        }
    } catch {
        return "";
    }
    return "";
};

export const isHostedVideoUrl = (value) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(value || "");