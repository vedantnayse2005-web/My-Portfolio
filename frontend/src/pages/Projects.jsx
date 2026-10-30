
import "./Projects.css";

const projects = [
  {
    number: "01",
    name: "MelodyStream",
    category: "MUSIC STREAMING WEB APPLICATION",
    description:
      "A responsive music streaming interface inspired by modern music platforms, featuring dynamic UI elements and interactive playback controls.",
    technologies: ["HTML", "CSS", "JavaScript"],
    github: "https://github.com/your-username/MelodyStream",
    demo: "",
  },
  {
    number: "02",
    name: "TaskFlow",
    category: "TASK MANAGEMENT SYSTEM",
    description:
      "An API-based task management application with CRUD functionality, database integration, and organized backend workflows.",
    technologies: ["Node.js", "Express.js", "REST API", "MongoDB"],
    github: "https://github.com/your-username/TaskFlow",
    demo: "",
  },
  {
    number: "03",
    name: "Wanderlust",
    category: "TRAVEL LISTING WEB APPLICATION",
    description:
      "A travel listing application built with Node.js, Express, MongoDB, and EJS, featuring listing management and image integration.",
    technologies: ["Node.js", "Express.js", "MongoDB", "EJS"],
    github: "https://github.com/vedantnayse2005-web/Wanderlust",
    demo: "",
  },
];

function Projects() {
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

      <div className="projects-grid">
        {projects.map((project) => (
          <article className="project-card" key={project.number}>
            <div className="project-top">
              <span>{project.number} / PROJECT</span>
              <span className="project-arrow">↗</span>
            </div>

            <span className="project-category">{project.category}</span>
            <h3>{project.name}</h3>
            <p className="project-description">{project.description}</p>

            <div className="project-tags">
              {project.technologies.map((technology) => (
                <span key={technology}>{technology}</span>
              ))}
            </div>

            <div className="project-links">
              <a href={project.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>

              {project.demo && (
                <a href={project.demo} target="_blank" rel="noreferrer">
                  Live Demo ↗
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Projects;
