
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <a href="#home" className="brand">
            <span className="brand-symbol">V</span>
            <span>DEV<span className="green">FOLIO.</span></span>
          </a>

          <p>
            Building digital experiences with creativity,
            curiosity, and code.
          </p>
        </div>

        <div className="footer-navigation">
          <h3>QUICK LINKS</h3>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer-connect">
          <h3>LET'S CONNECT</h3>
          <a href="https://github.com/vedantnayse2005-web"
             target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href="https://www.linkedin.com/in/vedant-nayse/"
             target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
          <a href="mailto:vedantnayse2005@gmail.com">
            Email ↗
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} Vedant Nayse. All rights reserved.</p>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}

export default Footer;
