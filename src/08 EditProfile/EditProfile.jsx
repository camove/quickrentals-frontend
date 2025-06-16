import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Form, useActionData } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import UserFormFields from "../Utils/UserFormFields";
import ReusableModal from "../Utils/ReusableModal";
import toast, { Toaster } from "react-hot-toast";
import styles from "./EditProfile.module.css";
import { emailPattern, passwordPattern } from "../Utils/UserFormFields";

// Action pentru update profil si parola
export const actionEditProfile = async ({ request, params }) => {
  const formData = await request.formData();
  const { id } = params;
  const action = formData.get("action");

  try {
    const token = localStorage.getItem("token");

    if (action === "updateProfile") {
      // Update date personale
      const updateData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthDate: formData.get("birthDate"),
        email: formData.get("email"),
      };

      const response = await fetch(`http://localhost:3000/users/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          user: data.data,
          action: "profile",
          emailChanged: data.emailChanged || false,
          message: data.message,
        };
      } else {
        return { success: false, error: data.message, action: "profile" };
      }
    } else if (action === "changePassword") {
      // Change password
      const token = localStorage.getItem("token");

      // Decodeaza token-ul pentru a obtine user info
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentUserId = payload.id;

      const isAdmin = formData.get("isAdmin") === "true";
      const isAdminEditingOtherUser = currentUserId !== id && isAdmin;

      let passwordData;

      if (!isAdminEditingOtherUser) {
        // User normal - isi schimba propria parola
        passwordData = {
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
          confirmNewPassword: formData.get("confirmPassword"),
        };
      } else {
        // Admin - reseteaza parola altui user
        passwordData = {
          userId: id, // Indica backend-ului ca e admin editing
          newPassword: formData.get("newPassword"),
          confirmNewPassword: formData.get("confirmPassword"),
        };
      }

      const response = await fetch(
        `http://localhost:3000/users/updatePassword`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message, action: "password" };
      } else {
        return { success: false, error: data.message, action: "password" };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
};

const EditProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, loggedIn, setLoggedIn, setUserId, setToken, token } =
    useContext(AuthContext);
  const actionData = useActionData();

  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutReason, setLogoutReason] = useState("");

  // State pentru form - compatibil cu UserFormFields
  const [formData, setFormDataState] = useState({
    email: "",
    firstName: "",
    lastName: "",
    birthDate: "",
  });

  const [errors, setErrors] = useState({});

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (e) => {
    const { name, value } = e.target;
    let error = "";

    if (name === "newPassword" && !passwordPattern.test(value)) {
      error =
        "Password must contain at least 8 characters: letters, numbers and one special character.";
    } else if (
      name === "confirmPassword" &&
      value !== passwordData.newPassword
    ) {
      error = "Passwords do not match.";
    }

    setPasswordErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isAdminEditingOtherUser =
    userId !== id && loggedIn?.isAdmin === "admin";

  // Handler pentru onChange - compatibil cu UserFormFields
  const setFormData = (e) => {
    const { name, value } = e.target;
    setFormDataState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler pentru validare
  const validate = (e) => {
    const { name, value } = e.target;
    let error = "";

    if (name === "email") {
      if (!emailPattern.test(value)) {
        error = "Invalid e-mail format.";
      }
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

  // Verifica drepturile
  useEffect(() => {
    if (!loggedIn) return;

    if (userId !== id && loggedIn.isAdmin !== "admin") {
      toast.error("You can only edit your own profile");
      navigate("/home");
    }
  }, [userId, id, loggedIn, navigate]);

  // Incarca datele utilizatorului
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);

          // Seteaza valorile in formData
          setFormDataState({
            email: data.data.email || "",
            firstName: data.data.firstName || "",
            lastName: data.data.lastName || "",
            birthDate: data.data.birthDate
              ? data.data.birthDate.split("T")[0]
              : "",
          });
        } else {
          
          // console.error("Failed to fetch user data. Status:", response.status);

          // Check explicit pentru 404
          if (response.status === 404 || response.status === 500) {
            console.log("🚫 User not found - redirecting to 404 page");
            navigate("/404");
            return; // Stop execution
          } else {
            // Other HTTP errors
            console.log("Other error - redirecting to home");
            toast.error("Failed to load profile data");
            navigate("/home");
          }
        }
      } catch (error) {
        // Network/connection errors
        console.error("Network error fetching user data:", error);
        toast.error("Network error loading profile");
        navigate("/home");
      }
      setIsLoading(false);
    };

    if (token) {
      fetchUserData();
    }
  }, [id, navigate, token]);

  // Gestioneaza raspunsurile
  useEffect(() => {
    if (actionData?.success) {
      if (actionData.action === "profile") {
        // Update profil
        if (userId === id && actionData.user) {
          setLoggedIn(actionData.user);
        }

        if (actionData.emailChanged) {
          if (isAdminEditingOtherUser) {
            // Admin a schimbat email-ul altui user - doar redirect
            toast.success("User profile updated successfully!");
            setTimeout(() => {
              navigate("/all-users");
            }, 2000);
          } else {
            // User normal si-a schimbat propriul email - logout necesar
            toast.success("Profile updated successfully!");
            setLogoutReason("email");
            setShowLogoutModal(true);
          }
        } else {
          // Update normal - redirect diferit pentru admin vs user
          toast.success("Profile updated successfully!");
          const redirectPath = isAdminEditingOtherUser ? "/all-users" : "/home";
          setTimeout(() => {
            navigate(redirectPath);
          }, 2000);
        }
      } else if (actionData.action === "password") {
        // DIFERENTIAZA intre admin editing și user normal
        if (isAdminEditingOtherUser) {
          // Admin a resetat parola altui user - doar mesaj success
          toast.success(
            `Password for ${userData?.firstName} ${userData?.lastName} was successfully changed!`
          );
          // Redirect la all-users pentru admin
          setTimeout(() => {
            navigate("/all-users");
          }, 2000);
        } else {
          // User normal si-a schimbat parola - logout necesar
          toast.success("Password changed successfully!");
          setLogoutReason("password");
          setShowLogoutModal(true);
        }
      }
    } else if (actionData?.error) {
      // Arata eroarea cu toast
      toast.error(actionData.error);
    }
  }, [
    actionData,
    navigate,
    id,
    userId,
    setLoggedIn,
    isAdminEditingOtherUser,
    userData,
  ]);

  // Handler pentru logout dupa schimbare email/parola
  const handleLogout = () => {
    // Logout
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("loginTime");
    setLoggedIn(null);
    setUserId(null);
    setToken(null);
    setShowLogoutModal(false);

    // Redirect cu mesaj specific
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <div className={styles.loadingText}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>User not found</div>
      </div>
    );
  }

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

      <div className={styles.formWrapper}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>Edit Profile</h1>
        </div>

        {/* Profile Update Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>

          <Form method="post" className={styles.form}>
            <input type="hidden" name="action" value="updateProfile" />

            <UserFormFields
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              validate={validate}
              hidePasswordFields={true}
              setErrors={setErrors}
            />

            <button type="submit" className={styles.saveButton}>
              Save Changes
            </button>
          </Form>
        </div>

        {/* Password Change Section */}
        <div className={styles.passwordSection}>
          <h2 className={styles.sectionTitle}>
            {isAdminEditingOtherUser
              ? "Reset User Password"
              : "Change Password"}
          </h2>

          <Form method="post" className={styles.passwordForm}>
            <input type="hidden" name="action" value="changePassword" />
            <input
              type="hidden"
              name="isAdmin"
              value={loggedIn?.isAdmin === "admin"}
            />

            {/* CONDITIONAL: Afiseaza "Current Password" doar daca NU este admin editing */}
            {!isAdminEditingOtherUser && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Enter your current password"
                  className={styles.input}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {isAdminEditingOtherUser
                  ? "New Password for User"
                  : "New Password"}
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password (min. 8 characters)"
                className={styles.input}
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                onBlur={validatePassword}
                required
              />
              {passwordErrors.newPassword && (
                <p className={styles.errorText}>{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm the new password"
                className={styles.input}
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                onBlur={validatePassword}
                required
              />
              {passwordErrors.confirmPassword && (
                <p className={styles.errorText}>
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            <button type="submit" className={styles.changePasswordButton}>
              {isAdminEditingOtherUser
                ? "Reset User Password"
                : "Change Password"}
            </button>
          </Form>
        </div>
      </div>

      {/* Modal pentru logout dupa schimbari - DOAR pentru user normal */}
      {!isAdminEditingOtherUser && (
        <ReusableModal
          isOpen={showLogoutModal}
          onClose={logoutReason === "email" ? null : () => setShowLogoutModal(false)}
          onConfirm={handleLogout}
          title={
            logoutReason === "email" ? "Email Updated" : "Password Changed"
          }
          message={
            logoutReason === "email"
              ? "Your email has been updated successfully. Please login again with your new email address."
              : "Your password has been changed successfully. Please login again with your new password."
          }
          warning="You will be redirected to the login page."
          confirmText="Continue to Login"
          cancelText={null}
          type="info"
          loading={false}
        />
      )}
    </div>
  );
};

export default EditProfile;
