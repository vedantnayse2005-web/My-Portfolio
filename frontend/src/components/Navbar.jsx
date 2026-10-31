
import { useEffect, useState } from "react";
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

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 16);
  const [activeSection, setActiveSection] = useState("home");
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isCertificatesPage = location.pathname === "/certificates";

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 16;
      setIsScrolled((current) => current === scrolled ? current : scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return undefined;

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
  }, [isHome]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape" && menuOpen) {
      closeMenu();
      event.currentTarget.querySelector(".menu-toggle")?.focus();
    }
  };

  return (
    <>
      <nav
        className={`navbar ${isScrolled ? "scrolled" : ""}`}
        onKeyDown={handleKeyDown}
      >
        <a href={isHome ? "#home" : "/#home"} className="brand" onClick={closeMenu}>
          <span className="brand-symbol">V</span>
          <span>DEV<span className="green">FOLIO.</span></span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div
          className={`nav-links ${menuOpen ? "active" : ""}`}
          id="primary-navigation"
        >
          {sectionLinks.map(({ id, label }) => {
            const active = isHome && activeSection === id;
            return (
              <a
                className={active ? "active" : ""}
                href={isHome ? `#${id}` : `/#${id}`}
                key={id}
                onClick={() => {
                  closeMenu();
                  if (isHome) setActiveSection(id);
                }}
                aria-current={active ? "location" : undefined}
              >
                {label}
              </a>
            );
          })}
          <Link
            className={isCertificatesPage ? "active" : ""}
            to="/certificates"
            onClick={closeMenu}
            aria-current={isCertificatesPage ? "page" : undefined}
          >
            Certificates
          </Link>
        </div>

        <a href={isHome ? "#contact" : "/#contact"} className="nav-contact" onClick={closeMenu}>
          Let's Talk <span>↗</span>
        </a>
      </nav>
      <div className="navbar-spacer" aria-hidden="true" />
    </>
  );
}

export default Navbar;
