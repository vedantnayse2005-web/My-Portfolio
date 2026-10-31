import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config/api";
import { getVideoEmbedUrl, getVideoPlatform, isHostedVideoUrl } from "../utils/editingVideoUrl";
import "./EditingHome.css";

const EMAIL = "vedantnayse2005@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/vedant-nayse/";

function EditingHero({ profile }) {
  return (
    <section className="editing-hero" id="editing-home">
      <div className="editing-hero-copy">
        <p className="editing-eyebrow"><span /> INDEPENDENT VIDEO EDITOR</p>
        <h1>Make the<br /><em>moment</em> matter.</h1>
        <p className="editing-hero-intro">
          {profile?.professionalIntroduction || "I’m Vedant Nayse. I shape footage into focused, story-led edits with a feel for rhythm, atmosphere and detail."}
        </p>
        <div className="editing-hero-actions">
          <a className="editing-button editing-button-primary" href="#editing-projects">
            View My Work <span>↘</span>
          </a>
          <a className="editing-button editing-button-quiet" href="#editing-contact">
            Contact Me <span>↗</span>
          </a>
        </div>
        <div className="editing-hero-meta">
          <span>VEDANT NAYSE</span>
          <span>VIDEO EDITOR</span>
        </div>
      </div>

      <div className="editing-hero-visual" aria-label="Portrait of Vedant Nayse">
        <div className="editing-portrait-backdrop" />
        <div className="editing-portrait-frame">
          <span className="editing-portrait-fallback" aria-hidden="true">VN</span>
          <img
            src={`${API_BASE_URL}/api/editing/profile-photo`}
            alt="Editing portfolio profile"
            onError={(event) => { event.currentTarget.hidden = true; }}
          />
          <span className="editing-portrait-index">01 / FRAME</span>
        </div>
        <div className="editing-visual-caption">
          <span>STORY FIRST</span>
          <span>FRAME BY FRAME</span>
        </div>
      </div>
      <a className="editing-scroll-cue" href="#editing-showreel">SCROLL TO EXPLORE <span>↓</span></a>
    </section>
  );
}

function ShowreelEmbed({ videoUrl, title, platform, embedUrl }) {
  const [embedFailed, setEmbedFailed] = useState(false);

  return (
    <>
      <div className={`editing-video-frame ${platform === "instagram" ? "editing-video-frame-instagram" : ""}`}>
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setEmbedFailed(true)}
        />
      </div>
      <p className="editing-embed-fallback" role={embedFailed ? "status" : undefined}>
        {embedFailed
          ? "The embed could not load. The content may be private, deleted, or unavailable. "
          : platform === "instagram"
            ? "If the Instagram embed is unavailable, watch the original on Instagram. "
            : "If the embedded player is unavailable, open the original video. "}
        <a href={videoUrl} target="_blank" rel="noreferrer">
          {platform === "instagram" ? "Watch on Instagram ↗" : "Open original video ↗"}
        </a>
      </p>
    </>
  );
}

function EditingShowreel({ showreel, loading, error }) {
  const videoUrl = showreel?.videoUrl || "";
  const embedUrl = getVideoEmbedUrl(videoUrl);
  const platform = getVideoPlatform(videoUrl);

  return (
    <section className="editing-section editing-showreel" id="editing-showreel">
      <div className="editing-section-heading">
        <p className="editing-eyebrow">01 / FEATURED FILM</p>
        <h2>{showreel?.title || "The showreel"}<span>.</span></h2>
        {showreel?.description && <p className="editing-showreel-description">{showreel.description}</p>}
      </div>
      {loading ? (
        <p className="editing-data-message" role="status">Loading showreel...</p>
      ) : error ? (
        <p className="editing-data-message editing-data-error" role="alert">{error}</p>
      ) : videoUrl && isHostedVideoUrl(videoUrl) ? (
        <video className="editing-video-player" controls playsInline preload="metadata">
          <source src={videoUrl} />
          Your browser does not support embedded video.
        </video>
      ) : embedUrl ? (
        <ShowreelEmbed
          key={videoUrl}
          videoUrl={videoUrl}
          title={showreel?.title || "Vedant Nayse editing showreel"}
          platform={platform}
          embedUrl={embedUrl}
        />
      ) : videoUrl ? (
        <div className="editing-reel-empty">
          <div className="editing-reel-mark" aria-hidden="true">VN<span> / REEL</span></div>
          <div>
            <p className="editing-eyebrow">EMBED UNAVAILABLE</p>
            <h3>{showreel?.title || "This video cannot be embedded."}</h3>
            <p>Open the original video to view it.</p>
            <a className="editing-original-video-link" href={videoUrl} target="_blank" rel="noreferrer">Open original video ↗</a>
          </div>
        </div>
      ) : (
        <div className="editing-reel-empty">
          <div className="editing-reel-mark" aria-hidden="true">VN<span> / REEL</span></div>
          <div>
            <p className="editing-eyebrow">A FIRST LOOK IS ON ITS WAY</p>
            <h3>{showreel?.title || "The showreel will live here."}</h3>
            <p>A showreel will appear here once one has been added and enabled in the admin dashboard.</p>
          </div>
          <span className="editing-reel-time">00:00</span>
        </div>
      )}
    </section>
  );
}

function EditingAbout({ profile, error }) {
  return (
    <section className="editing-section editing-about" id="editing-about">
      <p className="editing-eyebrow">02 / THE APPROACH</p>
      <div className="editing-about-grid">
        <h2>Every cut<br />has a <em>reason.</em></h2>
        <div>
          <p className="editing-about-lead">
            {profile?.aboutDescription || "Good editing is less about adding more and more about finding what matters."}
          </p>
          {error ? (
            <p className="editing-data-error" role="alert">{error}</p>
          ) : profile?.creativeApproach ? (
            <p>{profile.creativeApproach}</p>
          ) : (
            <p className="editing-data-message">Creative approach details can be added from the admin dashboard.</p>
          )}
          {profile?.editingInterests?.length > 0 && (
            <div className="editing-interest-list">
              {profile.editingInterests.map((interest) => <span key={interest}>{interest}</span>)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EditingSkills({ skills, error, loading }) {
  const capabilities = skills.filter((skill) => !skill.isTool);
  const tools = skills.filter((skill) => skill.isTool);

  return (
    <section className="editing-section editing-capabilities" id="editing-skills">
      <div className="editing-section-heading">
        <p className="editing-eyebrow">03 / CREATIVE DISCIPLINES</p>
        <h2>What goes into<br /><em>the frame.</em></h2>
      </div>
      {loading ? (
        <p className="editing-data-message" role="status">Loading editing skills...</p>
      ) : error ? (
        <p className="editing-data-message editing-data-error" role="alert">{error}</p>
      ) : capabilities.length > 0 ? (
        <div className="editing-capability-list">
          {capabilities.map((skill, index) => (
            <div className="editing-capability" key={skill._id}>
              <span className="editing-capability-number">{String(skill.displayOrder || index + 1).padStart(2, "0")}</span>
              <h3>{skill.name}</h3>
              <span className="editing-capability-arrow" aria-hidden="true">{skill.proficiencyLevel || "↗"}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="editing-data-message">Editing skills will appear here when enabled in the dashboard.</p>
      )}
      <div className="editing-tools">
        <p className="editing-eyebrow">SOFTWARE & TOOLS</p>
        {tools.length > 0 ? (
          <div className="editing-tool-list">
            {tools.map((tool) => <span key={tool._id}>{tool.name}</span>)}
          </div>
        ) : <p className="editing-data-message">No editing software has been added yet.</p>}
      </div>
    </section>
  );
}

function EditingProjects({ projects, error, loading }) {
  return (
    <section className="editing-section editing-projects" id="editing-projects">
      <div className="editing-section-heading editing-projects-heading">
        <div>
          <p className="editing-eyebrow">04 / SELECTED WORK</p>
          <h2>Films &<br /><em>projects.</em></h2>
        </div>
        <p>Every project deserves its own rhythm. A selection will appear here as work is added.</p>
      </div>

      {loading ? (
        <p className="editing-data-message" role="status">Loading editing projects...</p>
      ) : error ? (
        <p className="editing-data-message editing-data-error" role="alert">{error}</p>
      ) : projects.length > 0 ? (
        <div className="editing-project-grid">
          {projects.map((project) => {
            const embedUrl = getVideoEmbedUrl(project.videoUrl || "");
            return (
              <article className="editing-project-card" key={project.id || project.title}>
                <div className="editing-project-media">
                  {project.videoUrl && isHostedVideoUrl(project.videoUrl) ? (
                    <video controls playsInline preload="metadata" poster={project.thumbnail || undefined}>
                      <source src={project.videoUrl} />
                    </video>
                  ) : embedUrl ? (
                    <iframe src={embedUrl} title={`${project.title} video`} allowFullScreen />
                  ) : project.thumbnail ? (
                    <img src={project.thumbnail} alt={`${project.title} thumbnail`} loading="lazy" />
                  ) : project.thumbnailUrl ? (
                    <img src={`${API_BASE_URL}${project.thumbnailUrl}`} alt={`${project.title} thumbnail`} loading="lazy" />
                  ) : <div className="editing-project-placeholder">{project.category}</div>}
                </div>
                <div className="editing-project-details">
                  <p className="editing-eyebrow">{project.category}</p>
                  <h3>{project.title}</h3>
                      <p>{project.description}</p>
                  {project.software?.length > 0 && <span>{project.software.join(" · ")}</span>}
                  {project.externalUrl && <a href={project.externalUrl} target="_blank" rel="noreferrer">Watch project ↗</a>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="editing-projects-empty">
          <span className="editing-empty-index">00</span>
          <p>Selected editing projects have not been added yet.</p>
          <span className="editing-empty-rule" />
        </div>
      )}
    </section>
  );
}

function EditingExperience({ experience, error, loading }) {
  return (
    <section className="editing-section editing-experience" id="editing-experience">
      <p className="editing-eyebrow">05 / EXPERIENCE</p>
      <div className="editing-experience-content">
        <h2>Work in<br /><em>progress.</em></h2>
        {loading ? (
          <p className="editing-experience-empty" role="status">Loading experience...</p>
        ) : error ? (
          <p className="editing-experience-empty editing-data-error" role="alert">{error}</p>
        ) : experience.length > 0 ? (
          <div className="editing-experience-list">
            {experience.map((entry) => (
              <article key={entry._id}>
                <span>{new Date(entry.startDate).toLocaleDateString()} – {entry.currentlyWorking ? "Present" : entry.endDate ? new Date(entry.endDate).toLocaleDateString() : ""}</span>
                <h3>{entry.role}</h3>
                <p>{entry.organization} · {entry.employmentType}</p>
                <p>{entry.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="editing-experience-empty">
            Editing roles, freelance work or internships can be added here when you’re ready to share them.
          </p>
        )}
      </div>
    </section>
  );
}

function EditingContact({ profile }) {
  const contactEmail = profile?.contactEmail || EMAIL;

  return (
    <section className="editing-section editing-contact" id="editing-contact">
      <p className="editing-eyebrow">06 / LET’S MAKE SOMETHING</p>
      <div className="editing-contact-layout">
        <h2>Have a story<br />to <em>tell?</em></h2>
        <div className="editing-contact-details">
          <p>For editing projects and collaboration inquiries, get in touch.</p>
          <a className="editing-email" href={`mailto:${contactEmail}?subject=Video%20editing%20collaboration`}>
            {contactEmail} <span>↗</span>
          </a>
          <div className="editing-social-links">
            <a href={profile?.linkedinUrl || LINKEDIN_URL} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            {profile?.instagramUrl ? (
              <a href={profile.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a>
            ) : <span aria-label="Instagram profile link not provided">Instagram · link to be added</span>}
            <a href="/#contact">Use the portfolio contact form ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditingHome() {
  const [content, setContent] = useState({ profile: null, showreel: null, projects: [], skills: [], experience: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const endpoints = ["profile", "showreel", "projects", "skills", "experience"];
    const fetchContent = async () => {
      const results = await Promise.all(endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/editing/${endpoint}`, { signal: controller.signal });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || `Unable to load ${endpoint}.`);
          return [endpoint, result.data, ""];
        } catch (error) {
          return [endpoint, null, error.name === "AbortError" ? "" : error.message || `Unable to load ${endpoint}.`];
        }
      }));

      if (controller.signal.aborted) return;
      const nextContent = { profile: null, showreel: null, projects: [], skills: [], experience: [] };
      const nextErrors = {};
      results.forEach(([endpoint, data, error]) => {
        if (error) nextErrors[endpoint] = error;
        else nextContent[endpoint] = endpoint === "projects" || endpoint === "skills" || endpoint === "experience" ? data || [] : data;
      });
      setContent(nextContent);
      setErrors(nextErrors);
      setLoading(false);
    };

    fetchContent();
    return () => controller.abort();
  }, []);

  return (
    <div className="editing-site">
      <Navbar variant="editing" />
      <main>
        <EditingHero profile={content.profile} />
        <EditingShowreel showreel={content.showreel} loading={loading} error={errors.showreel} />
        <EditingAbout profile={content.profile} error={errors.profile} />
        <EditingSkills skills={content.skills} loading={loading} error={errors.skills} />
        <EditingProjects projects={content.projects} loading={loading} error={errors.projects} />
        <EditingExperience experience={content.experience} loading={loading} error={errors.experience} />
        <EditingContact profile={content.profile} />
      </main>
      <footer className="editing-footer">
        <a href="#editing-home">VEDANT NAYSE <span>/ VIDEO EDITOR</span></a>
        <p>© {new Date().getFullYear()} · <a href="/">Developer portfolio ↗</a></p>
      </footer>
    </div>
  );
}

export default EditingHome;