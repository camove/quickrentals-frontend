import React, { useContext } from "react";
import styles from "./Register.module.css";
import { Form } from "react-router-dom";
import UserFormFields from "../Utils/UserFormFields";
import { useEffect, useState } from "react";
import { useNavigate, useActionData } from "react-router-dom";
import { emailPattern, passwordPattern } from "../Utils/UserFormFields";
import toast, { Toaster } from "react-hot-toast";
import { AuthContext } from "../Context/AuthContext";

//* Action function pentru prelucradea datelor din formular *//
export const actionRegisterUser = async ({ request }) => {
  const formData = await request.formData();

  //-> Se creeaza obiectul user cu proprietatile preluate din input-uri
  const user = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("repeatPassword"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    isAdmin: "regular_user",
  };

  //-> Creare obiect gol errors, care ulterior se populează cu proprietătile email, password, etc care au valorile egale cu mesajul de eroare
  const errors = {};

  if (!emailPattern.test(user.email)) {
    errors.email = "Invalid e-mail format.";
  }

  if (!passwordPattern.test(user.password)) {
    errors.password =
      "Password must contain at least 8 characters: letters, numbers and one special character.";
  }

  if (user.password !== user.confirmPassword) {
    errors.repeatPassword = "Passwords does not match.";
  }

  if (user.firstName.length < 2) {
    errors.firstName = "First name must have at least two characters.";
  }

  if (user.lastName.length < 2) {
    errors.lastName = "Last name must have at least two characters.";
  }

  const today = new Date();
  const birthDate = new Date(user.birthDate);
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 18 || age > 120) {
    errors.birthDate = "Age must be between 18 and 120 years.";
  }

  // Creare array cu proprietatile din obiectul errors; daca array-ul nu este gol, inseamna ca avem campuri nevalide si returnam un boolean false
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // Inlocuieste Firebase addDoc cu fetch catre backend
    const response = await fetch(
      "https://quickrentals-backend.onrender.com/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || "Registration failed" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

// Creare obiect cu proprietati cu valori "" pentru gestionare valori initiale inputuri
const initialFormState = {
  email: "",
  password: "",
  repeatPassword: "",
  firstName: "",
  lastName: "",
  birthDate: "",
};

const Register = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const actionData = useActionData();

  useEffect(() => {
    // Daca avem salvare cu succes a utilizatorului
    if (actionData?.success) {
      setFormData(initialFormState); // resetam formularul
      setErrors({}); // golim obiectul cu mesajele de eroare
      toast.success("User added with success!"); // afisam toaster-ul cu mesajul de succes
      setTimeout(() => {
        navigate("/login"); // utilizatorul este redirectionat catre pagina de login după 2s de la inregistrarea cu succes
      }, 2000);
    } else if (actionData?.errors) {
      setErrors(actionData.errors);
      toast.error("Please correct all errors before submitting the form."); // toast cu mesaj de avertizare
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Verificare date introduse de utilizator în campurile de input(verificare imediat dupa introducerea datelor)
  const validate = async (e) => {
    const { name, value } = e.target;
    let error = "";

    if (name === "email") {
      if (!emailPattern.test(value)) {
        error = "Invalid e-mail format.";
      }
    } else if (name === "password" && !passwordPattern.test(value)) {
      error =
        "Password must contain at least 8 characters: letters, numbers and one special character.";
    } else if (name === "repeatPassword" && value !== formData.password) {
      error = "Passwords does not match.";
    } else if (
      (name === "firstName" || name === "lastName") &&
      value.length < 2
    ) {
      error = "Name must have at least two characters.";
    } else if (name === "birthDate") {
      const today = new Date();
      const birthDate = new Date(value);

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      if (age < 18 || age > 120) {
        error = "Age must be between 18 and 120 years.";
      }
    }

    setErrors({ ...errors, [name]: error });
  };

  // Check if form is valid - pentru a activa/dezactiva butonul
  const isFormValid =
    Object.values(errors).every((error) => !error) &&
    Object.values(formData).every((value) => value.trim() !== "") &&
    formData.password === formData.repeatPassword;

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div className={styles.container}>
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

      <div className={styles.loginSection}>
        <div>
          <h2>Already have an account?</h2>
          <p>Sign in to access your profile</p>
          <button
            className={styles.loginButton}
            type="button"
            onClick={handleLoginRedirect}
          >
            Sign In
          </button>
        </div>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>CREATE ACCOUNT</h1>
          <p className={styles.subtitle}>
            Join us to find your perfect home 🏠
          </p>
        </div>

        {actionData?.success && (
          <div className={styles.successMessage}>
            ✅ Account created successfully! Redirecting to login...
          </div>
        )}

        {actionData?.error && (
          <div className={styles.errorMessage}>❌ {actionData.error}</div>
        )}

        <Form method="post" className={styles.form}>
          {/* apelare componenta UserFormFields */}
          <UserFormFields
            formData={formData}
            setFormData={handleInputChange}
            errors={errors}
            validate={validate}
            setErrors={setErrors}
          />

          <button
            className={styles.submitButton}
            type="submit"
            disabled={!isFormValid}
          >
            {!isFormValid
              ? "Please fill all fields correctly"
              : "Create Account"}
          </button>
        </Form>
      </div>
    </div>
  );
};

export default Register;
