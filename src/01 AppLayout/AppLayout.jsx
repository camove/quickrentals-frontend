import React, { useEffect, useContext } from "react";
import styles from "./AppLayout.module.css";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import Footer from "../Footer/Footer";
import SessionEnded from "../Utils/SessionEnded";
import { AuthContext } from "../Context/AuthContext";

const AppLayout = () => {
  const { pathname } = useLocation();

  //-> aducem din AuthContext functiile / informatiile de care avem nevoie
  const { showWarningModal, setShowWarningModal } = useContext(AuthContext);

  //* Resetare pozitie scroll la schimbarea rutei *//
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleCloseSessionModal = () => {
    setShowWarningModal(false);
  };

  return (
    <>
      <div>
        <NavBar />
        <div className={styles.outlet}>
          <Outlet />
        </div>
        <Footer />
      </div>

      {/* Modal pentru logout automat dupa 60 min, este valabil in toata aplicatia */}
      <SessionEnded 
        isOpen={showWarningModal}
        onClose={handleCloseSessionModal}
      />
    </>
  );
};

export default AppLayout;