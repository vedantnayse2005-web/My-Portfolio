
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/useTheme";
import "./Navbar.css";

const sectionLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" }
];

function Navbar({ variant = "main" }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 16);
  const [activeSection, setActiveSection] = useState("home");
  const aboutTriggerRef = useRef(null);
  const location = useLocation();
  const isEditing = variant === "editing";
  const isHome = location.pathname === "/";
  const isCertificatesPage = location.pathname === "/certificates";

  const closeNavigation = () => {
    setMenuOpen(false);
    setAboutOpen(false);
  };

  const openDropdownOnHover = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setAboutOpen(true);
    }
  };

  const closeDropdownOnLeave = () => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setAboutOpen(false);
    }
  };

  const handleAboutClick = () => {
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setAboutOpen((open) => supportsHover ? true : !open);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 16;
      setIsScrolled((current) => current === scrolled ? current : scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome || isEditing) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top);

      if (visibleSections[0]) {
        setActiveSection(visibleSections[0].target.id);
      }
    }, {
      rootMargin: "-20% 0px -65% 0px",
      threshold: 0
    });

    sectionLinks.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [isHome, isEditing]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && (menuOpen || aboutOpen)) {
      closeNavigation();
      (aboutTriggerRef.current || event.currentTarget.querySelector(".menu-toggle"))?.focus();
    }
  };

  return (
    <>
      <nav
        className={`navbar ${isScrolled ? "scrolled" : ""} ${isEditing ? "navbar-editing" : ""}`}
        onKeyDown={handleKeyDown}
      >
        {isEditing ? (
          <a href="#editing-home" className="brand editing-brand" onClick={closeNavigation}>
            <span className="brand-symbol">VN</span>
            <span>VEDANT NAYSE<span className="green"> / EDITOR</span></span>
          </a>
        ) : (
          <a href={isHome ? "#home" : "/#home"} className="brand" onClick={closeNavigation}>
            <span className="brand-symbol">V</span>
            <span>DEV<span className="green">FOLIO.</span></span>
          </a>
        )}

        {isEditing ? (
          <div className={`nav-links editing-nav-links ${menuOpen ? "active" : ""}`} id="editing-navigation">
            <a href="#editing-home" onClick={closeNavigation}>Home</a>
            <a href="#editing-projects" onClick={closeNavigation}>Work</a>
            <a href="#editing-about" onClick={closeNavigation}>About</a>
            <a href="#editing-contact" onClick={closeNavigation}>Contact</a>
            <Link to="/" className="editing-return-link" onClick={closeNavigation}>Developer Portfolio <span>↗</span></Link>
          </div>
        ) : (
          <div className={`nav-links ${menuOpen ? "active" : ""}`} id="primary-navigation">
            <a
              className={isHome && activeSection === "home" ? "active" : ""}
              href={isHome ? "#home" : "/#home"}
              onClick={closeNavigation}
            >
              Home
            </a>
            <div
              className={`nav-dropdown ${aboutOpen ? "open" : ""}`}
              onMouseEnter={openDropdownOnHover}
              onMouseLeave={closeDropdownOnLeave}
            >
              <button
                ref={aboutTriggerRef}
                className={`nav-dropdown-trigger ${isHome && ["about", "skills", "projects"].includes(activeSection) ? "active" : ""}`}
                type="button"
                aria-expanded={aboutOpen}
                aria-controls="about-navigation"
                onClick={handleAboutClick}
              >
                About <span className="nav-dropdown-caret" aria-hidden="true">⌄</span>
              </button>
              <div className="nav-dropdown-menu" id="about-navigation">
                {[{ id: "about", label: "Overview" }, { id: "skills", label: "Skills" }, { id: "projects", label: "Projects" }].map(({ id, label }) => {
                  const active = isHome && activeSection === id;
                  return (
                    <a
                      className={active ? "active" : ""}
                      href={isHome ? `#${id}` : `/#${id}`}
                      key={id}
                      onClick={() => {
                        closeNavigation();
                        if (isHome) setActiveSection(id);
                      }}
                      aria-current={active ? "location" : undefined}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </div>
            <Link
              className={isCertificatesPage ? "active" : ""}
              to="/certificates"
              onClick={closeNavigation}
              aria-current={isCertificatesPage ? "page" : undefined}
            >
              Certificates
            </Link>
            <Link
              className={location.pathname === "/editing" ? "active" : ""}
              to="/editing"
              onClick={closeNavigation}
              aria-current={location.pathname === "/editing" ? "page" : undefined}
            >
              Editing
            </Link>
            <a href={isHome ? "#contact" : "/#contact"} onClick={closeNavigation}>Contact</a>
          </div>
        )}

        <div className="nav-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="theme-icon sun-icon"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="theme-icon moon-icon"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => {
              if (open) setAboutOpen(false);
              return !open;
            })}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls={isEditing ? "editing-navigation" : "primary-navigation"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>
      <div className="navbar-spacer" aria-hidden="true" />
    </>
  );
}

export default Navbar;
