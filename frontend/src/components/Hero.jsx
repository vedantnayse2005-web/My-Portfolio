
import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import "./Hero.css";

function Hero() {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let objectUrl;

    const fetchProfilePhoto = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile-photo`);
        if (!response.ok) {
          if (response.status !== 404) {
            throw new Error("Unable to load profile photo.");
          }
          return;
        }

        const photo = await response.blob();
        if (isActive) {
          objectUrl = URL.createObjectURL(photo);
          setProfilePhotoUrl(objectUrl);
        }
      } catch {
        if (isActive) {
          setProfilePhotoUrl("");
        }
      } finally {
        if (isActive) {
          setProfilePhotoLoading(false);
        }
      }
    };

    fetchProfilePhoto();
    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <main id="home" className="hero-section">
      <div className="hero-content">

        <div className="availability">
          <span className="status-dot"></span>
          AVAILABLE FOR OPPORTUNITIES
        </div>

        <p className="hero-greeting">
          Hello, I'm <span>VEDANT NAYSE</span>
        </p>

        {/* Profile Photo */}
        <div className="hero-profile" aria-busy={profilePhotoLoading}>
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt="Vedant Nayse"
              className="hero-profile-image"
            />
          ) : (
            <div className="hero-profile-fallback" role="status">
              {profilePhotoLoading ? "Loading" : "VN"}
            </div>
          )}
        </div>

        <h1>
          Building digital
          <br />
          experiences that
          <br />
          <span className="outline-text">make an impact.</span>
        </h1>

        <p className="hero-description">
          I'm a developer focused on building modern, responsive
          and user-friendly web applications. I turn ideas into
          functional digital experiences.
        </p>

        <div className="hero-buttons">
          <a href="#projects" className="primary-btn">
            Explore My Work <span>↗</span>
          </a>

          <a href={`${API_BASE_URL}/api/resume`} className="secondary-btn">
            Download Resume <span>↓</span>
          </a>
        </div>

        <div className="social-links">
          <span>CONNECT WITH ME</span>

          <a
            href="https://github.com/vedantnayse2005-web"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>

          <a
            href="https://www.linkedin.com/in/vedant-nayse/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn ↗
          </a>
        </div>
      </div>

      <div className="hero-visual">
        <div className="visual-glow"></div>
        <div className="orbit orbit-one"></div>
        <div className="orbit orbit-two"></div>

        <div className="code-window">
          <div className="window-header">
            <div className="window-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>developer.js</span>
          </div>

          <div className="code-content">
            <p>
              <span className="code-purple">const</span> developer = {"{"}
            </p>

            <p className="indent">
              name: <span className="code-green">"Vedant Nayse"</span>,
            </p>

            <p className="indent">
              role: <span className="code-green">"Full Stack Developer"</span>,
            </p>

            <p className="indent">skills: [</p>

            <p className="indent double">
              <span className="code-orange">"React"</span>,
              <span className="code-orange"> "Node.js"</span>,
            </p>

            <p className="indent double">
              <span className="code-orange">"JavaScript"</span>
            </p>

            <p className="indent">],</p>

            <p className="indent">
              passion: <span className="code-green">"Building ideas"</span>
            </p>

            <p>{"}"}</p>

            <p className="code-comment">
              // Let's build something great.
            </p>

            <p className="terminal-cursor">▌</p>
          </div>
        </div>

        <div className="floating-card card-top">
          <span>✳</span> Creative Thinking
        </div>

        <div className="floating-card card-bottom">
          <span className="status-dot"></span> Clean Code
        </div>
      </div>

      <div className="hero-scroll">
        <span></span> SCROLL TO EXPLORE
      </div>
    </main>
  );
}

export default Hero;
