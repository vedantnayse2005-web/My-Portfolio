
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = useLocation().pathname === "/";

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <a href={isHome ? "#home" : "/"} className="brand" onClick={closeMenu}>
        <span className="brand-symbol">V</span>
        <span>DEV<span className="green">FOLIO.</span></span>
      </a>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <a href={isHome ? "#home" : "/"} onClick={closeMenu}>Home</a>
        <a href={isHome ? "#about" : "/#about"} onClick={closeMenu}>About</a>
        <a href={isHome ? "#skills" : "/#skills"} onClick={closeMenu}>Skills</a>
        <a href={isHome ? "#projects" : "/#projects"} onClick={closeMenu}>Projects</a>
        <a href={isHome ? "#experience" : "/#experience"} onClick={closeMenu}>Experience</a>
        <Link to="/certificates" onClick={closeMenu}>Certificates</Link>
        <a href={isHome ? "#contact" : "/#contact"} onClick={closeMenu}>Contact</a>
      </div>

      <a href={isHome ? "#contact" : "/#contact"} className="nav-contact" onClick={closeMenu}>
        Let's Talk <span>↗</span>
      </a>
    </nav>
  );
}

export default Navbar;
