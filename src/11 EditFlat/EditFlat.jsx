import React, { useContext, useState, useEffect } from "react";
import styles from "./EditFlat.module.css";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import FlatFormFields from "../Utils/FlatFormFields";

const countRealImages = (images) => {
  return images.filter((img) => img !== "default.jpg").length;
};

const EditFlat = () => {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

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
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [flatNotFound, setFlatNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch flat data pentru precompletare
  useEffect(() => {
    const fetchFlatData = async () => {
      if (!id || !token) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/flats/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const flatData = data.data || data;

          // Verifica daca user-ul este owner-ul apartamentului
          const flatOwnerId = flatData.ownerId?._id || flatData.ownerId;
          if (flatOwnerId !== userId) {
            toast.error("You can only edit your own apartments");
            navigate("/my-flats");
            return;
          }

          // Precompleteaza formularul cu datele existente
          setFormData({
            city: flatData.city || "",
            streetName: flatData.streetName || "",
            streetNumber: flatData.streetNumber || "",
            areaSize: flatData.areaSize || "",
            hasAc: flatData.hasAc || false,
            yearBuilt: flatData.yearBuilt || "",
            rentPrice: flatData.rentPrice || "",
            dateAvailable: flatData.dateAvailable
              ? flatData.dateAvailable.split("T")[0]
              : "",
          });

          // Seteaza imaginile existente
          setExistingImages(flatData.flatImages || []);
        } else if (response.status === 404) {
          setFlatNotFound(true);
          toast.error("Apartment not found");
        } else {
          toast.error("Failed to load apartment data");
          navigate("/my-flats");
        }
      } catch (error) {
        console.error("Error fetching flat:", error);
        toast.error("Network error");
        navigate("/my-flats");
      } finally {
        setLoading(false);
      }
    };

    fetchFlatData();
  }, [id, token, userId, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validari frontend
    const errors = {};
    if (!formData.city || formData.city.length < 2) {
      errors.city = "City must have at least two characters";
    }
    if (!formData.streetName || formData.streetName.length < 2) {
      errors.streetName = "Street Name must have at least two characters";
    }
    if (
      isNaN(parseInt(formData.areaSize)) ||
      parseInt(formData.areaSize) < 10
    ) {
      errors.areaSize = "Size must be a number and greater than 10 sq meters.";
    }
    if (
      isNaN(parseInt(formData.yearBuilt)) ||
      parseInt(formData.yearBuilt) < 1000
    ) {
      errors.yearBuilt = "Year build must be a number and greater than 1000";
    }

    const currentDate = new Date();
    const inputDate = new Date(formData.dateAvailable);
    if (inputDate <= currentDate) {
      errors.dateAvailable = "Date must be in the future.";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      toast.error("Please correct all the errors");
      return;
    }

    setSubmitting(true);

    try {
      // Creeaza FormData
      const submitFormData = new FormData();
      submitFormData.append("city", formData.city);
      submitFormData.append("streetName", formData.streetName);
      submitFormData.append("streetNumber", formData.streetNumber);
      submitFormData.append("areaSize", formData.areaSize);
      submitFormData.append("hasAc", formData.hasAc ? "true" : "false");
      submitFormData.append("yearBuilt", formData.yearBuilt);
      submitFormData.append("rentPrice", formData.rentPrice);
      submitFormData.append("dateAvailable", formData.dateAvailable);

      // Adauga imaginile noi dacă exista
      selectedFiles.forEach((file) => {
        submitFormData.append("photos", file);
      });

      // Trimite la backend
      const response = await fetch(`http://localhost:3000/flats/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      });

      if (response.ok) {
        toast.success("Apartment updated successfully!");
        setTimeout(() => {
          navigate("/my-flats");
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update apartment");
      }
    } catch (error) {
      console.error("Failed to update apartment:", error);
      toast.error("Failed to update apartment");
    } finally {
      setSubmitting(false);
    }
  };
  const handleInputChange = (e) => {
    if (!e || !e.target) return;

    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Gestionare upload imagini noi
  const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  
  // facem replace la imagini, validam doar imaginile noi
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

  // Stergere toate fisierele noi
  const clearAllFiles = () => {
    setSelectedFiles([]);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Validari în timp real
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

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <div className={styles.loadingText}>Loading apartment data...</div>
        </div>
      </div>
    );
  }

  // Not found state
  if (flatNotFound) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Apartment Not Found</h2>
          <p>
            The apartment you're looking for doesn't exist or you don't have
            permission to edit it.
          </p>
          <button
            onClick={() => navigate("/my-flats")}
            className={styles.backButton}
          >
            Back to My Apartments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
                color: 'white',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
                color: 'white',
              },
            },
          }}
        />
      </div>

      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <button
            onClick={() => navigate("/my-flats")}
            className={styles.backButton}
          >
            ← Back to My Apartments
          </button>
          <h1 className={styles.title}>Edit Apartment</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className={styles.form}
        >
          {/* FlatFormFields pentru câmpurile de bază */}
          <FlatFormFields
            formData={formData}
            setFormData={handleInputChange}
            errors={errors}
            validate={validate}
          />

          {/* Current Images - doar daca sunt imagini reale */}
          {existingImages.length > 0 && countRealImages(existingImages) > 0 && (
            <div className={styles.existingImagesSection}>
              <label className={styles.sectionLabel}>
                Current Images ({countRealImages(existingImages)}/3)
              </label>
              <div className={styles.existingImages}>
                {existingImages
                  .filter((imagePath) => imagePath !== "default.jpg") // 🎯 Ascunde default.jpg
                  .map((imagePath, index) => (
                    <div key={index} className={styles.existingImage}>
                      <img
                        src={`http://localhost:3000${imagePath}`}
                        alt={`Apartment ${index + 1}`}
                        className={styles.imagePreview}
                        onError={(e) => {
                          e.target.src =
                            "http://localhost:3000/uploads/default.jpg";
                        }}
                      />
                    </div>
                  ))}
              </div>
              <p className={styles.imageNote}>
                Note: Uploading new images will completely replace all current
                images.
              </p>
            </div>
          )}

          {/* Daca sunt doar imagini default, arata mesaj diferit */}
          {existingImages.length > 0 &&
            countRealImages(existingImages) === 0 && (
              <div className={styles.existingImagesSection}>
                <label className={styles.sectionLabel}>
                  Current Images (0/3)
                </label>
                <div className={styles.noRealImages}>
                  <p>
                    No custom images uploaded yet. Using default placeholder.
                  </p>
                </div>
              </div>
            )}

          {/* Upload imagini noi */}
          <div className={styles.uploadSection}>
            <label className={styles.uploadLabel}>
              {countRealImages(existingImages) > 0
                ? "Replace Images (optional)"
                : "Property Images (max 3)"}
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
                  <p>New images to upload:</p>
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
            <button
              className={styles.updateButton}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFlat;
