
import { useState } from "react";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setStatus("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
      }

      setStatus("Message sent successfully!");
      
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });

    } catch (error) {
      setStatus(error.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="contact-heading">
        <span className="section-label">05 / GET IN TOUCH</span>
        <h2>
          Have a project in
          <span> mind?</span>
        </h2>
        <p>
          I'm open to software development opportunities, collaborations,
          and interesting projects. Let's connect.
        </p>
      </div>

      <div className="contact-content">
        <div className="contact-info">
          <h3>Let's start a conversation.</h3>
          <p>
            Have an opportunity or just want to say hello?
            Feel free to reach out.
          </p>

          <a
            className="contact-email"
            href="mailto:vedantnayse2005@gmail.com"
          >
            vedantnayse2005@gmail.com ↗
          </a>

          <div className="contact-socials">
            <a href="https://github.com/vedantnayse2005-web"
               target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/"
               target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <label htmlFor="contact-name">YOUR NAME</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-email">YOUR EMAIL</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-subject">SUBJECT</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            placeholder="What is this about?"
            value={formData.subject}
            onChange={handleChange}
            required
          />

          <label htmlFor="contact-message">MESSAGE</label>
          <textarea
            id="contact-message"
            name="message"
            rows="5"
            placeholder="Write your message..."
            value={formData.message}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message ↗"}
          </button>

          {status && <p role="status">{status}</p>}
        </form>
      </div>
    </section>
  );
}

export default Contact;
