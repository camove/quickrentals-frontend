import React, { useContext, useState, useEffect } from "react";
import styles from "./AddFlat.module.css";
import { Form, useActionData, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import FlatFormFields from "../Utils/FlatFormFields";

// Action pentru React Router
export const actionAddFlat = async ({ request }) => {
  const formData = await request.formData();

  // Validari frontend (inainte de trimitere la backend)
  const errors = {};
  const city = formData.get("city");
  const streetName = formData.get("streetName");
  const areaSize = formData.get("areaSize");
  const yearBuilt = formData.get("yearBuilt");
  const availableDate = formData.get("dateAvailable");

  if (!city || city.length < 2) {
    errors.city = "City must have at least two characters";
  }
  if (!streetName || streetName.length < 2) {
    errors.streetName = "Street Name must have at least two characters";
  }
  if (isNaN(parseInt(areaSize)) || parseInt(areaSize) < 10) {
    errors.areaSize = "Size must be a number and greater than 10 sq meters.";
  }
  if (isNaN(parseInt(yearBuilt)) || parseInt(yearBuilt) < 1000) {
    errors.yearBuilt = "Year build must be a number and greater than 1000";
  }

  const currentDate = new Date();
  const inputDate = new Date(availableDate);
  if (inputDate <= currentDate) {
    errors.dateAvailable = "Date must be in the future.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // Obtine token-ul din localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    // Converteste hasAc în boolean
    const hasAcValue = formData.get("hasAc");
    formData.set("hasAc", hasAcValue === "on" ? "true" : "false");

    // Trimite la backend cu multer upload
    const response = await fetch(
      "https://quickrentals-backend.onrender.com/flats",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Nu adaugam Content-Type pentru FormData - browser-ul o face automat
        },
        body: formData, // FormData cu imagini
      }
    );

    if (!response.ok) {
      // Pentru debugging CORS
      console.error("Response status:", response.status);
      console.error("Response headers:", response.headers);

      // Incearca sa citesti raspunsul doar daca e JSON
      try {
        const data = await response.json();
        return { success: false, error: data.message || "Failed to add flat" };
      } catch (e) {
        return { success: false, error: `Server error: ${response.status}` };
      }
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Failed to add flat:", error);
    return { success: false, error: error.message };
  }
};

const AddFlat = () => {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    city: "",
    streetName: "",
    streetNumber: "",
    areaSize: "",
    hasAc: false,
    yearBuilt: "",
    rentPrice: "",
    dateAvailable: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const actionData = useActionData();

  useEffect(() => {
    if (actionData?.success) {
      toast.success("Flat added successfully!");
      setTimeout(() => {
        navigate("/home"); // Redirect la home dupa success
      }, 2000);
    } else if (actionData?.errors) {
      setErrors(actionData.errors);
      toast.error("Failed to add flat. Please correct all the errors");
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);

  // Actualizeaza starea formularului
  const handleInputChange = (e) => {
    if (!e || !e.target) return;

    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Gestionare upload imagini
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error("Maximum 3 images allowed");
      return;
    }
    setSelectedFiles(files);
  };

  // Stergere fisier specific
  const removeFile = (indexToRemove) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // Stergere toate fisierele
  const clearAllFiles = () => {
    setSelectedFiles([]);
    // Reset input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Validari in timp real
  const validate = (e) => {
    const { name, value } = e.target;
    let error = "";

    if (name === "city" && (!value || value.length < 2)) {
      error = "City is required and must be at least two letters long.";
    } else if (name === "streetName" && !value) {
      error = "Street name is required.";
    } else if (name === "streetNumber" && !value) {
      error = "Street number is required.";
    } else if (
      name === "areaSize" &&
      (isNaN(parseInt(value)) || parseInt(value) < 10)
    ) {
      error = "Size must be a number and greater than 10 sq meters.";
    } else if (
      name === "yearBuilt" &&
      (isNaN(parseInt(value)) || parseInt(value) < 1000)
    ) {
      error = "Year build must be a number and greater than 1000.";
    } else if (name === "rentPrice" && !value) {
      error = "Price is required.";
    } else if (name === "dateAvailable") {
      const today = new Date();
      const inputDate = new Date(value);
      if (inputDate <= today) {
        error = "Available date must be in the future.";
      }
    }

    setErrors({ ...errors, [name]: error });
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

      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Add New Flat</h1>

        <Form
          method="post"
          encType="multipart/form-data"
          className={styles.form}
        >
          {/* FlatFormFields pentru campurile de baza */}
          <FlatFormFields
            formData={formData}
            setFormData={handleInputChange}
            errors={errors}
            validate={validate}
          />

          {/* Upload imagini */}
          <div className={styles.uploadSection}>
            <label className={styles.uploadLabel}>
              Property Images (max 3)
            </label>
            <input
              type="file"
              name="photos"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className={styles.fileInput}
            />

            {selectedFiles.length > 0 && (
              <div className={styles.selectedFiles}>
                <div className={styles.filesHeader}>
                  <p>Selected files:</p>
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className={styles.clearAllButton}
                  >
                    Clear All
                  </button>
                </div>
                <ul className={styles.filesList}>
                  {selectedFiles.map((file, index) => (
                    <li key={index} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className={styles.removeFileButton}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.buttonContainer}>
            <button className={styles.addButton} type="submit">
              Add Flat
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddFlat;
