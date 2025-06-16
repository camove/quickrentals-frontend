import React, { useContext, useState, useEffect } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import email from "../assets/envelope.svg";
import lock from "../assets/lock.svg";

const Login = () => {
  const { setUserId, setLoggedIn, setToken, timerLogout, loggedIn, token } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verifica daca user-ul e deja logat
  useEffect(() => {
    if (loggedIn && token) {
      // Daca user-ul e deja logat, redirectioneaza la home
      navigate("/home", { replace: true });
    }
  }, [loggedIn, token, navigate]);

  // Functie pentru actualizarea valorilor din input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Functie pentru login cu backend Node.js
  const loginUser = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // Previne double submit

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "https://quickrentals-backend.onrender.com/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Login successful
        const dateNow = new Date();

        // Actualizeaza state-urile din AuthContext
        setUserId(data.userToValidate._id);
        setToken(data.token);
        setLoggedIn(data.userToValidate);

        // Salveaza în localStorage
        localStorage.setItem("userId", data.userToValidate._id);
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "loginTime",
          dateNow.toLocaleTimeString("en-us", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        // Start timer pentru logout automat după 60 min
        timerLogout();

        setTimeout(() => {
          navigate("/home"); // Redirect la home page
        }, 1500);
      } else {
        // Login failed - afiseaza eroarea de la backend
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  return (
    <div className={styles.container}>
      <div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10b981",
                color: "white",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "#ef4444",
                color: "white",
              },
            },
          }}
        />
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={loginUser} className={styles.form}>
          <h1 className={styles.formTitle}>LOGIN</h1>

          <div className={styles.inputCell}>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="E-mail:"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            <div className={styles.inputIcons}>
              <img src={email} alt="Email icon" />
            </div>
          </div>

          <div className={styles.inputCell}>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password:"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
            <div className={styles.inputIcons}>
              <img src={lock} alt="Password icon" />
            </div>
          </div>

          <button
            className={styles.loginButton}
            type="submit"
            disabled={isSubmitting || !formData.email || !formData.password}
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>

      <div className={styles.registerDiv}>
        <div>
          <h2>Ready to Connect, Chat and Move In?</h2>
          <p>Create your account and start finding home today</p>
          <button
            className={styles.registerButton}
            type="button"
            onClick={handleRegisterRedirect}
            disabled={isSubmitting}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
