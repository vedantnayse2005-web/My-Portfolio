
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setCredentials({
      ...credentials,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(credentials)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      // Keep token for this browser session
      sessionStorage.setItem("adminToken", result.token);

      navigate("/admin/dashboard");

    } catch (error) {
      setError(error.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <span className="admin-label">ADMIN ACCESS</span>

        <h1>
          Welcome <span>Back.</span>
        </h1>

        <p className="admin-subtitle">
          Sign in to manage your portfolio.
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="username">USERNAME</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={handleChange}
            required
          />

          {error && <p className="admin-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In ↗"}
          </button>

        </form>

        <button
          className="admin-back-button"
          type="button"
          onClick={() => navigate("/")}
        >
          ← Back to Portfolio
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;
