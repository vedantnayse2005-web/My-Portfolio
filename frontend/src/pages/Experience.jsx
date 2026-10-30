
import "./Experience.css";

const experiences = [
  {
    number: "01",
    period: "CURRENT",
    type: "EDUCATION",
    title: "B.Tech in Computer Science Engineering",
    organization: "Prof. Ram Meghe Institute of Technology and Research",
    description:
      "Currently pursuing my final year of B.Tech, building a foundation in computer science, programming, databases, and software development.",
    tags: ["Computer Science", "Programming", "Problem Solving"],
  },
  {
    number: "02",
    period: "PROJECT EXPERIENCE",
    type: "PRACTICAL DEVELOPMENT",
    title: "Full-Stack & Web Development Projects",
    organization: "Personal Projects",
    description:
      "Built projects including MelodyStream, TaskFlow, and Wanderlust to practise frontend development, CRUD operations, API integration, and database management.",
    tags: ["React", "JavaScript", "Node.js", "MongoDB"],
  },
  {
    number: "03",
    period: "ONGOING",
    type: "SKILL DEVELOPMENT",
    title: "Learning & Technical Growth",
    organization: "Independent Learning",
    description:
      "Continuously improving my development skills through hands-on coding, project building, and learning modern web technologies.",
    tags: ["React", "Backend Development", "DSA"],
  },
];

function Experience() {
  return (
    <section id="experience" className="experience-section">
      <div className="experience-heading">
        <span className="section-label">04 / MY JOURNEY</span>
        <h2>
          Learning, building,
          <span> growing.</span>
        </h2>
        <p>
          My journey so far in computer science and software development.
        </p>
      </div>

      <div className="experience-list">
        {experiences.map((item) => (
          <article className="experience-item" key={item.number}>
            <div className="experience-number">{item.number}</div>

            <div className="experience-main">
              <div className="experience-meta">
                <span>{item.type}</span>
                <span>{item.period}</span>
              </div>

              <h3>{item.title}</h3>
              <h4>{item.organization}</h4>
              <p>{item.description}</p>

              <div className="experience-tags">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <span className="experience-icon">↗</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Experience;
