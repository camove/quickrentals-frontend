import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReusableModal from "../Utils/ReusableModal";

const SessionEnded = ({ isOpen, onClose }) => {
  const { setLoggedIn, setUserId, setToken, setShowWarningModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSessionExpired = () => {
    //-> Curatare auth state (deja e facut în AuthContext, dar să fim siguri)
    setLoggedIn(null);
    setUserId(null);
    setToken(null);
    setShowWarningModal(false); // ascunde modalul
    
    //-> sterge localStorage
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");
    
    //-> inchide modalul
    onClose();
    
    //-> Redirectionare la login
    navigate("/login");
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={handleSessionExpired} 
      onConfirm={handleSessionExpired}
      title="Session Expired"
      message={
        <>
          Your 60-minute session has expired.
          <br />
          <strong>Please login again to continue using the application.</strong>
        </>
      }
      warning="For your security, you have been automatically logged out."
      confirmText="Login Again"
      cancelText={null} // buton de cancel ascuns, nu e optionala delogarea automata
      type="warning"
      loading={false}
    />
  );
};

export default SessionEnded;