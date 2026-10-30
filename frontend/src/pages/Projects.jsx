import { useEffect, useState } from "react";
import "./Projects.css";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load projects.");
        }

        setProjects(result.data || []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section id="projects" className="projects-section">
      <div className="projects-heading">
        <span className="section-label">03 / SELECTED WORK</span>
        <h2>
          Things I've
          <span> built.</span>
        </h2>
        <p>
          A selection of projects where I turn ideas into functional
          digital experiences.
        </p>
      </div>

      {loading && <p className="projects-status">Loading projects...</p>}
      {error && <p className="projects-status" role="alert">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="projects-status">Projects will appear here soon.</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map((project, index) => (
            <article className="project-card" key={project._id}>
              {project.imageUrl && (
                <img
                  className="project-image"
                  src={project.imageUrl}
                  alt={`${project.title} project`}
                  loading="lazy"
                />
              )}
              <div className="project-top">
                <span>{String(index + 1).padStart(2, "0")} / PROJECT</span>
                <span className="project-arrow">↗</span>
              </div>

              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <div className="project-tags">
                {(project.technologies || []).map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>

              {(project.githubLink || project.liveDemoLink) && (
                <div className="project-links">
                  {project.githubLink && (
                    <a href={project.githubLink} target="_blank" rel="noreferrer">
                      GitHub ↗
                    </a>
                  )}
                  {project.liveDemoLink && (
                    <a href={project.liveDemoLink} target="_blank" rel="noreferrer">
                      Live Demo ↗
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Projects;
