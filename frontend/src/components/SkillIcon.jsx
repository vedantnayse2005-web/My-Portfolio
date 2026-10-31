import { useState } from "react";
import "./SkillIcon.css";

function SkillIcon({ icon, name, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = name?.trim().charAt(0).toUpperCase() || "?";

  if (!icon || imageFailed) {
    return (
      <span className={`skill-icon skill-icon-fallback ${className}`} aria-hidden="true">
        {fallback}
      </span>
    );
  }

  return (
    <img
      className={`skill-icon ${className}`}
      src={icon}
      alt=""
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

export default SkillIcon;