
import "./About.css";
import { Link } from "react-router-dom";

function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-heading">
        <span className="section-label">01 / ABOUT ME</span>
        <h2>
          Turning curiosity into
          <span> meaningful code.</span>
        </h2>
      </div>

      <div className="about-content">
        <div className="about-intro">
          <h3>Who I am</h3>
          <p>
            I'm Vedant Nayse, a final-year Computer Science Engineering
            student passionate about software development and building
            modern web applications.
          </p>
          <p>
            I enjoy working with JavaScript, React, Node.js, and databases
            to create practical digital solutions. Through projects like
            MelodyStream and TaskFlow, I've explored frontend development,
            CRUD operations, database management, and API integration.
          </p>
          <p>
            I'm currently focused on strengthening my full-stack
            development skills and growing as a software developer.
          </p>
          <Link className="about-certificates-link" to="/certificates">
            View All Certificates <span>↗</span>
          </Link>
        </div>

        <div className="about-details">
          <div className="about-detail">
            <span>EDUCATION</span>
            <h3>B.Tech — Computer Science</h3>
            <p>Final Year · Prof. Ram Meghe Institute of Technology and Research</p>
          </div>

          <div className="about-detail">
            <span>FOCUS</span>
            <h3>Full-Stack Development</h3>
            <p>Building responsive interfaces and practical web applications.</p>
          </div>

          <div className="about-detail">
            <span>CURRENTLY LEARNING</span>
            <h3>React & Backend Development</h3>
            <p>Improving my skills through hands-on projects and practice.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
