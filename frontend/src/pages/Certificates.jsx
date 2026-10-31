import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Certificates.css";

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchCertificates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/certificates`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load certificates.");
        }
        if (isActive) setCertificates(result.data || []);
      } catch (fetchError) {
        if (isActive) setError(fetchError.message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchCertificates();
    return () => {
      isActive = false;
    };
  }, []);

  const categories = ["All", ...new Set(certificates.map((item) => item.category).filter(Boolean))];
  const visibleCertificates = category === "All"
    ? certificates
    : certificates.filter((item) => item.category === category);

  return (
    <div className="portfolio-app certificates-page">
      <Navbar />
      <main className="certificates-main">
        <header className="certificates-heading">
          <span className="section-label">CREDENTIALS / LEARNING</span>
          <h1>Certificates<span>.</span></h1>
          <p>Professional credentials and milestones in my learning journey.</p>
          <a className="certificates-home-link" href="/">← Back to Home</a>
        </header>

        {!loading && !error && certificates.length > 0 && (
          <div className="certificate-filters" aria-label="Filter certificates by category">
            {categories.map((item) => (
              <button
                className={category === item ? "active" : ""}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="certificates-feedback" role="status">Loading certificates...</p>}
        {error && <p className="certificates-feedback certificates-error" role="alert">{error}</p>}
        {!loading && !error && certificates.length === 0 && (
          <p className="certificates-feedback">No certificates have been published yet.</p>
        )}
        {!loading && !error && certificates.length > 0 && visibleCertificates.length === 0 && (
          <p className="certificates-feedback">No certificates in this category.</p>
        )}

        {!loading && !error && visibleCertificates.length > 0 && (
          <div className="certificates-grid">
            {visibleCertificates.map((certificate) => {
              const fileUrl = `${API_BASE_URL}${certificate.fileUrl}`;
              const isPdf = certificate.contentType === "application/pdf";
              return (
                <article className="certificate-card" key={certificate._id}>
                  <div className="certificate-preview">
                    {isPdf ? (
                      <iframe src={fileUrl} title={`${certificate.title} PDF preview`} />
                    ) : (
                      <img src={fileUrl} alt={`${certificate.title} certificate`} loading="lazy" />
                    )}
                  </div>
                  <div className="certificate-card-content">
                    <span className="certificate-category">{certificate.category || "Certificate"}</span>
                    <h2>{certificate.title}</h2>
                    <p className="certificate-issuer">{certificate.issuer}</p>
                    <p className="certificate-date">
                      Issued {new Date(certificate.issueDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long"
                      })}
                    </p>
                    {certificate.credentialId && (
                      <p className="certificate-credential">
                        Credential ID <span>{certificate.credentialId}</span>
                      </p>
                    )}
                    {certificate.description && <p className="certificate-description">{certificate.description}</p>}
                    <a className="certificate-view-link" href={fileUrl} target="_blank" rel="noreferrer">
                      View Certificate <span>↗</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Certificates;