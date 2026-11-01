
import { useEffect, useState } from "react";
import "./About.css";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config/api";

function About() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchAbout = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/about`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load About content.");
        }
        if (isActive) setAbout(result.data);
      } catch (fetchError) {
        if (isActive) setError(fetchError.message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchAbout();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section id="about" className="about-section">
      {loading && <p className="about-state" role="status">Loading About content...</p>}
      {error && (
        <p className="about-state" role="alert">
          About content could not be loaded: {error}
        </p>
      )}
      {!loading && !error && about && (
        <>
          <div className="about-heading">
            <span className="section-label">01 / ABOUT ME</span>
            <h2>{about.heading}</h2>
          </div>

          <div className="about-content">
            <div className="about-intro">
              <h3>Who I am</h3>
              <p>{about.shortIntroduction}</p>
              {about.professionalBiography && (
                <p className="about-biography">{about.professionalBiography}</p>
              )}
              <Link className="about-certificates-link" to="/certificates">
                View All Certificates <span>↗</span>
              </Link>
            </div>

            <div className="about-details">
              {[
                ["EDUCATION", about.educationDetails],
                ["CAREER GOALS", about.careerGoals],
                ["ADDITIONAL INFORMATION", about.additionalInformation]
              ].filter(([, content]) => content).map(([label, content]) => (
                <div className="about-detail" key={label}>
                  <span>{label}</span>
                  <p>{content}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default About;
