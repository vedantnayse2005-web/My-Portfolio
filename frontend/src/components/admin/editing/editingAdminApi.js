import API_BASE_URL from "../../../config/api";
export { getVideoEmbedUrl, getVideoPlatform, isHostedVideoUrl, isValidVideoUrl } from "../../../utils/editingVideoUrl";

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
