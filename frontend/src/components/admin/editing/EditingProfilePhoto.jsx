import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../config/api";
import { editingAdminRequest, handleEditingAdminError } from "./editingAdminApi";

const allowedTypes = new Map([
    ["image/jpeg", [".jpg", ".jpeg"]],
    ["image/png", [".png"]],
    ["image/webp", [".webp"]]
]);

function EditingProfilePhoto() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("adminToken");
    const [available, setAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [photoVersion, setPhotoVersion] = useState(0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        let isActive = true;
        Promise.resolve().then(async () => {
            try {
                const result = await editingAdminRequest("/profile-photo/admin", token);
                if (isActive) setAvailable(Boolean(result.data?.exists));
            } catch (fetchError) {
                if (isActive && !handleEditingAdminError(fetchError, navigate)) setError(fetchError.message);
            } finally {
                if (isActive) setLoading(false);
            }
        });
        return () => { isActive = false; };
    }, [navigate, token]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const selectPhoto = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        const extension = selectedFile?.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();
        setError("");
        setStatus("");
        if (selectedFile && !allowedTypes.get(selectedFile.type)?.includes(extension)) {
            setPhotoFile(null);
            setPreviewUrl("");
            setError("Choose a JPG, JPEG, PNG, or WebP image.");
            event.target.value = "";
            return;
        }
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setPhotoFile(null);
            setPreviewUrl("");
            setError("Editing profile photos must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }
        setPhotoFile(selectedFile);
        setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
    };

    const uploadPhoto = async (event) => {
        event.preventDefault();
        if (!photoFile) {
            setError("Choose a photo to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("photo", photoFile);
        setUploading(true);
        setError("");
        setStatus("");
        try {
            const result = await editingAdminRequest("/profile-photo", token, { method: "POST", body: formData });
            setAvailable(true);
            setPhotoVersion(Date.now());
            setPhotoFile(null);
            setPreviewUrl("");
            setStatus(result.warning || result.message || "Editing profile photo uploaded successfully.");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (uploadError) {
            if (!handleEditingAdminError(uploadError, navigate)) setError(uploadError.message);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = async () => {
        if (!window.confirm("Remove the editing profile photo from your editing portfolio?")) return;
        setRemoving(true);
        setError("");
        setStatus("");
        try {
            const result = await editingAdminRequest("/profile-photo", token, { method: "DELETE" });
            setAvailable(false);
            setPhotoVersion(Date.now());
            setStatus(result.warning || result.message || "Editing profile photo removed successfully.");
        } catch (removeError) {
            if (!handleEditingAdminError(removeError, navigate)) setError(removeError.message);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <section className="editing-admin editing-admin-section" id="editing-profile-photo-admin">
            <div className="editing-admin-header">
                <h2>Editing Profile Photo</h2>
                <span>{loading ? "Loading..." : available ? "Photo set" : "Not set"}</span>
            </div>
            <div className="editing-profile-photo">
                <div className="editing-profile-photo-preview">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Selected editing profile photo preview" />
                    ) : available && !loading ? (
                        <img
                            src={`${API_BASE_URL}/api/editing/profile-photo?v=${photoVersion}`}
                            alt="Current editing profile photo"
                            onError={() => setError("The editing profile photo could not be loaded. Try uploading it again.")}
                        />
                    ) : (
                        <span>{loading ? "Loading..." : "VN"}</span>
                    )}
                </div>
                <form className="editing-profile-photo-form" onSubmit={uploadPhoto}>
                    <label htmlFor="editing-profile-photo-file">
                        Profile image (JPG, JPEG, PNG, or WebP; maximum 5 MB)
                    </label>
                    <input
                        id="editing-profile-photo-file"
                        ref={fileInputRef}
                        name="photo"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={selectPhoto}
                        disabled={loading || uploading || removing}
                    />
                    {photoFile && <p>Selected: {photoFile.name}</p>}
                    {error && <p className="editing-admin-error" role="alert">{error}</p>}
                    {status && <p className="editing-admin-success" role="status">{status}</p>}
                    <div className="editing-admin-actions">
                        <button className="editing-admin-button editing-admin-button-primary" type="submit" disabled={loading || uploading || removing || !photoFile}>
                            {uploading ? "Uploading..." : available ? "Replace Photo" : "Upload Photo"}
                        </button>
                        {available && (
                            <button className="editing-admin-button editing-admin-button-danger" type="button" onClick={removePhoto} disabled={loading || uploading || removing}>
                                {removing ? "Removing..." : "Remove Photo"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}

export default EditingProfilePhoto;
