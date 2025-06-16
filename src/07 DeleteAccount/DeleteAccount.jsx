import React, { useContext, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ReusableModal from "../Utils/ReusableModal";

const DeleteAccount = ({ isOpen, onClose }) => {
  const { setLoggedIn, setUserId, setToken, userId, token } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!userId || !token) {
      toast.error("Authentication required");
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Inchide modalul
        onClose();

        // Afiseaza mesaj de success
        toast.success("Account deleted successfully. Sorry to see you go!");

        // Redirectionare catre register dupa o mica intarziere

        navigate("/register");

        setTimeout(() => {
          // Reseteaza toate state-urile din AuthContext
          setLoggedIn(null);
          setUserId(null);
          setToken(null);

          // Elimina datele din localStorage
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          localStorage.removeItem("loginTime");
        }, 100);
      } else {
        const errorData = await response.json();
        console.error("Delete account error:", errorData);

        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          // Logout automat daca token invalid
          setLoggedIn(null);
          setUserId(null);
          setToken(null);
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          localStorage.removeItem("loginTime");
          navigate("/login");
        } else if (response.status === 403) {
          toast.error("You don't have permission to delete this account");
        } else {
          toast.error(errorData.message || "Failed to delete account");
        }
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDeleteAccount}
      title="Delete Account"
      message={
        <>
          Are you sure you want to delete your account permanently?
          <br />
          <strong>This will also delete:</strong>
          <ul
            style={{
              textAlign: "left",
              margin: "1rem 0",
              paddingLeft: "1.5rem",
              color: "#374151",
            }}
          >
            <li>All your posted apartments</li>
            <li>All your messages</li>
            <li>Your apartments from other users' favorites</li>
            <li>Your profile data</li>
          </ul>
        </>
      }
      warning="This action cannot be undone. All your data will be permanently deleted from our servers."
      confirmText="Yes, Delete My Account"
      cancelText="Cancel"
      type="delete"
      loading={deleting}
    />
  );
};

export default DeleteAccount;
