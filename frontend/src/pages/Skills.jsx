
import "./Skills.css";

const skillGroups = [
  {
    number: "01",
    title: "Programming Languages",
    skills: ["C++", "JavaScript", "Java", "SQL"],
  },
  {
    number: "02",
    title: "Frontend Development",
    skills: ["HTML", "CSS", "React", "Bootstrap"],
  },
  {
    number: "03",
    title: "Backend Development",
    skills: ["Node.js", "Express.js", "REST APIs", "CRUD Operations"],
  },
  {
    number: "04",
    title: "Databases",
    skills: ["MongoDB", "MySQL", "Mongoose"],
  },
  {
    number: "05",
    title: "Tools & Technologies",
    skills: ["Git", "GitHub", "VS Code"],
  },
];

function Skills() {
  return (
    <section id="skills" className="skills-section">
      <div className="skills-heading">
        <span className="section-label">02 / MY SKILLS</span>
        <h2>
          Technologies I use to
          <span> build things.</span>
        </h2>
        <p>
          My technical toolkit for developing responsive websites
          and practical software applications.
        </p>
      </div>

      <div className="skills-grid">
        {skillGroups.map((group) => (
          <div className="skill-card" key={group.number}>
            <div className="skill-card-top">
              <span>{group.number}</span>
              <span className="skill-arrow">↗</span>
            </div>

            <h3>{group.title}</h3>

            <div className="skill-tags">
              {group.skills.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Skills;
