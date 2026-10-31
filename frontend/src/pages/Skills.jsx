
import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import SkillIcon from "../components/SkillIcon";
import "./Skills.css";

const skillCategories = [
  "Programming Languages",
  "Frontend Development",
  "Backend Development",
  "Databases",
  "Developer Tools"
];

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchSkills = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/skills`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load skills.");
        }
        if (isActive) setSkills(result.data || []);
      } catch (fetchError) {
        if (isActive) setError(fetchError.message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchSkills();
    return () => {
      isActive = false;
    };
  }, []);

  const groups = skillCategories.map((title) => ({
    title,
    skills: skills
      .filter((skill) => skill.category === title)
      .sort((first, second) => Number(first.displayOrder) - Number(second.displayOrder)
        || first.name.localeCompare(second.name)
        || first._id.localeCompare(second._id))
  }))
    .filter((group) => group.skills.length > 0)
    .sort((first, second) => Number(first.skills[0].displayOrder) - Number(second.skills[0].displayOrder)
      || first.title.localeCompare(second.title));

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

      {loading && <p className="skills-feedback" role="status">Loading skills...</p>}
      {error && <p className="skills-feedback skills-error" role="alert">{error}</p>}
      {!loading && !error && skills.length === 0 && (
        <p className="skills-feedback">Skills will be added soon.</p>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="skills-grid">
          {groups.map((group) => (
            <div className="skill-card" key={group.title}>
              <div className="skill-card-top">
                <span>{group.skills.length} {group.skills.length === 1 ? "SKILL" : "SKILLS"}</span>
                <span className="skill-arrow">↗</span>
              </div>

              <h3>{group.title}</h3>

              <div className="skill-tags">
                {group.skills.map((skill) => (
                  <span className="skill-tag" key={skill._id}>
                    <span className="skill-order">{skill.displayOrder ?? 1}</span>
                    <SkillIcon
                      key={`${skill._id}-${skill.icon || ""}`}
                      icon={skill.icon}
                      name={skill.name}
                      className="skill-tag-icon"
                    />
                    <span>{skill.name}</span>
                    {skill.proficiencyLevel && <small>{skill.proficiencyLevel}</small>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Skills;
