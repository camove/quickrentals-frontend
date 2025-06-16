import React, { useContext, useState } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReusableModal from "../Utils/ReusableModal";

const Logout = ({ isOpen, onClose }) => {
  const { manualLogout } = useContext(AuthContext); 
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Funcție care foloseste manualLogout
  const handleLogout = async () => {
    setLoggingOut(true);
    
    try {
      // Simulam o mica intarziere pentru UX (optional)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Foloseste manualLogout care face tot cleanup-ul + clear timer
      manualLogout();
      
      // Inchide modalul
      onClose();
      
      // Redirectionare catre login
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoggingOut(false);
    }
  };
 
  // console.log('sessionActive:', sessionStorage.getItem('sessionActive'));
   
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleLogout}
      title="Logout"
      message="Are you sure you want to logout? You will need to sign in again to access your account."
      warning="Any unsaved changes will be lost."
      confirmText="Yes, Logout"
      cancelText="Cancel"
      type="logout"
      loading={loggingOut}
    />
  );
};

export default Logout;