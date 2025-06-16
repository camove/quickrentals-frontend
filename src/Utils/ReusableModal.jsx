import React from "react";
import styles from "./ReusableModal.module.css";

/**
 * Reusable Modal Component
 * 
 * @param {boolean} isOpen - afiseaza modalul
 * @param {function} onClose - functie pentru inchiderea modalului 
 * @param {function} onConfirm - functie care se executa la click pe butonul confirm 
 * @param {string} title - titlul modalului
 * @param {string|React.ReactNode} message - mesajul principal (continutul poate fi string sau JSX)
 * @param {string} warning - mesaj de avertizare, optional (mai mic, italic, colorat)
 * @param {string} confirmText - text pentru butonul de confirmare (default: "Confirm")
 * @param {string} cancelText - text pentru butonul cancel (default: "Cancel")
 * @param {string} type - tipul de modal pentru stilizare: "delete", "logout", "warning", "info" (default: "info")
 * @param {boolean} loading - shows loading state on confirm button
 */
const ReusableModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation",
  message = "Are you sure you want to proceed?",
  warning = null,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  loading = false
}) => {
  //-> modalul nu se incarca 
  if (!isOpen) return null;

  //-> inchidere modal daca se apasa in afara lui
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  //-> Handle confirm with loading state
  const handleConfirm = async () => {
    if (loading) return; // Prevent multiple clicks during loading
    await onConfirm();
  };

  //-> asignare clasa CSS in functie de tipul modalului
  const getTypeClasses = () => {
    switch (type) {
      case "delete":
        return {
          modal: styles.deleteModal,
          confirm: styles.deleteButton,
          title: styles.deleteTitle
        };
      case "logout":
        return {
          modal: styles.logoutModal,
          confirm: styles.logoutButton,
          title: styles.logoutTitle
        };
      case "warning":
        return {
          modal: styles.warningModal,
          confirm: styles.warningButton,
          title: styles.warningTitle
        };
      default: // "info"
        return {
          modal: styles.infoModal,
          confirm: styles.infoButton,
          title: styles.infoTitle
        };
    }
  };

  const typeClasses = getTypeClasses();

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div 
        className={`${styles.modalContent} ${typeClasses.modal}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Title */}
        <h2 className={`${styles.modalTitle} ${typeClasses.title}`}>
          {type === "delete" && "🗑️ "}
          {type === "logout" && "👋 "}
          {type === "warning" && "⚠️ "}
          {type === "info" && "ℹ️ "}
          {title}
        </h2>

        {/* Main Message */}
        <div className={styles.modalMessage}>
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        {/* Optional Warning Text */}
        {warning && (
          <p className={styles.modalWarning}>
            {warning}
          </p>
        )}

        {/* Action Buttons */}
        <div className={styles.modalButtons}>
          <button 
            onClick={handleConfirm}
            className={`${styles.confirmButton} ${typeClasses.confirm}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loadingContent}>
                <span className={styles.spinner}></span>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
          
          <button 
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReusableModal;