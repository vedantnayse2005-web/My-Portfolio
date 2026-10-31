
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
      </nav>
      <div className="navbar-spacer" aria-hidden="true" />
    </>
  );
}

export default Navbar;
