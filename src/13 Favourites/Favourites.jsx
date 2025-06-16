import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Favourites.module.css";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import PaginationControls from "../Utils/PaginationControls";

const Favourites = () => {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [favouriteFlats, setFavouriteFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12,
  });

  useEffect(() => {
    if (!userId || !token) return;

    // Citim valorile din URL
    const pageFromURL = parseInt(searchParams.get("page")) || 1;
    const limitFromURL = parseInt(searchParams.get("limit")) || 12;

    // Actualizăm pagination state-ul
    setPagination((prev) => ({
      ...prev,
      currentPage: pageFromURL,
      resultsPerPage: limitFromURL,
    }));

    // Fetch direct cu valorile din URL
    fetchFavouritesWithURLParams(pageFromURL, limitFromURL);
  }, [userId, token, searchParams]); // Elimină dependency pe pagination pentru a evita loop-ul

  // FETCH function care folosește parametrii din URL direct
  const fetchFavouritesWithURLParams = async (page, limit) => {
    // console.log('Fetching favorites - Page:', page, 'Limit:', limit);
    setLoading(true);

    try {
      // Build query params cu valorile din URL
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users/favorites?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // console.log('Favorites API Response:', data);

        setFavouriteFlats(data.data || []);

        // UPDATE PAGINATION STATE cu datele din API
        setPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
          resultsPerPage: limit,
        });

        // console.log('Favorites Pagination:', {
        //   currentPage: data.currentPage,
        //   totalPages: data.totalPages,
        //   totalResults: data.totalResults
        // });
      } else {
        console.error("Failed to fetch favorite flats");
        toast.error("Failed to load favorite apartments");
        setFavouriteFlats([]);
        setPagination((prev) => ({ ...prev, totalResults: 0, totalPages: 0 }));
      }
    } catch (error) {
      console.error("Error fetching favorite flats:", error);
      toast.error("Error loading favorite apartments");
      setFavouriteFlats([]);
      setPagination((prev) => ({ ...prev, totalResults: 0, totalPages: 0 }));
    }

    setLoading(false);
    setIsInitialLoad(false);
  };

  // PAGE CHANGE HANDLER
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Update URL
      setSearchParams({
        page: newPage.toString(),
        limit: pagination.resultsPerPage.toString(),
      });
    }
  };

  // RESULTS PER PAGE CHANGE
  const handleResultsPerPageChange = (newLimit) => {
    setSearchParams({
      page: "1", // Reset to first page
      limit: newLimit.toString(),
    });
  };

  // REMOVE FROM FAVORITES
  const handleRemoveFavourite = async (flatId) => {
    try {
      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users/favorites/${flatId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("Removed from favourites");

        // PAGINATION after remove
        const newTotal = pagination.totalResults - 1;
        const newTotalPages = Math.ceil(newTotal / pagination.resultsPerPage);

        // If current page becomes empty and we're not on page 1, go to previous page
        let targetPage = pagination.currentPage;
        if (pagination.currentPage > newTotalPages && newTotalPages > 0) {
          targetPage = newTotalPages;
        }

        // Refresh data for current/target page
        if (targetPage !== pagination.currentPage) {
          setSearchParams({
            page: targetPage.toString(),
            limit: pagination.resultsPerPage.toString(),
          });
        } else {
          // Refresh current page cu valorile din URL
          const currentPage = parseInt(searchParams.get("page")) || 1;
          const currentLimit = parseInt(searchParams.get("limit")) || 12;
          fetchFavouritesWithURLParams(currentPage, currentLimit);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to remove from favourites");
      }
    } catch (error) {
      console.error("Error removing from favourites:", error);
      toast.error("Failed to remove from favourites");
    }
  };

  // Navigate to flat details page
  const navigateToFlatDetails = (flatId) => {
    navigate(`/flat/${flatId}`);
  };

  // Modal functions for image carousel
  const openModal = (flat) => {
    setSelectedFlat(flat);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setSelectedFlat(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedFlat && selectedFlat.flatImages) {
      setCurrentImageIndex(
        (prev) => (prev + 1) % selectedFlat.flatImages.length
      );
    }
  };

  const prevImage = () => {
    if (selectedFlat && selectedFlat.flatImages) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedFlat.flatImages.length - 1 : prev - 1
      );
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading spinner during initial load or when flats are empty and loading
  if (isInitialLoad || (loading && favouriteFlats.length === 0)) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
        <p className={styles.loadingText}>
          Loading your favorite apartments...
        </p>
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

      <h1 className={styles.title}>My Favourite Apartments</h1>

      {pagination.totalResults === 0 ? (
        <div className={styles.noFavourites}>
          <div className={styles.emptyState}>
            <h2>No favorites yet! 💔</h2>
            <p>Start exploring and add some apartments to your favorites.</p>
            <button
              className={styles.exploreButton}
              onClick={() => navigate("/home")}
            >
              Explore Apartments
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* PAGINATION TOP */}
          {!loading && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onResultsPerPageChange={handleResultsPerPageChange}
              itemName="favorites"
            />
          )}

          {/* Cards Grid with loading state */}
          <div
            className={`${styles.flatsGrid} ${loading ? styles.loading : ""}`}
          >
            {favouriteFlats.map((flat) => (
              <div
                key={flat._id}
                className={styles.flatCard}
                onClick={() => openModal(flat)}
              >
                <div className={styles.flatImage}>
                  <img
                    src={`https://quickrentals-backend.onrender.com${
                      flat.flatImages?.[0] || "/uploads/default.jpg"
                    }`}
                    alt={`${flat.city} apartment`}
                    onError={(e) => {
                      e.target.src =
                        "https://quickrentals-backend.onrender.com/uploads/default.jpg";
                    }}
                  />

                  {/* Favorite button - always red since it's favorites page */}
                  <button
                    className={`${styles.favoriteButton} ${styles.active}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavourite(flat._id);
                    }}
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>

                  {/* AC Badge */}
                  {flat.hasAc && <div className={styles.acBadge}>❄️ AC</div>}
                </div>

                <div className={styles.flatContent}>
                  <h3 className={styles.flatCity}>{flat.city}</h3>
                  <p className={styles.flatAddress}>
                    {flat.streetName} {flat.streetNumber}
                  </p>
                  <div className={styles.flatDetails}>
                    <span className={styles.flatArea}>{flat.areaSize} m²</span>
                    <span className={styles.flatPrice}>
                      ${flat.rentPrice}/month
                    </span>
                  </div>
                  <div className={styles.flatYear}>
                    Built in {flat.yearBuilt}
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.cardActions}>
                    <button
                      className={styles.viewDetailsButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToFlatDetails(flat._id);
                      }}
                    >
                      View Details & Messages
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavourite(flat._id);
                      }}
                    >
                      Remove ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION BOTTOM */}
          {!loading && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onResultsPerPageChange={handleResultsPerPageChange}
              itemName="favorites"
            />
          )}
        </>
      )}

      {/* Modal for flat details */}
      {selectedFlat && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalCloseButton} onClick={closeModal}>
              ×
            </button>

            {/* Carousel imagini */}
            <div className={styles.imageCarousel}>
              {selectedFlat.flatImages &&
                selectedFlat.flatImages.length > 1 && (
                  <>
                    <button
                      className={styles.carouselButton}
                      onClick={prevImage}
                    >
                      ‹
                    </button>
                    <button
                      className={styles.carouselButton}
                      onClick={nextImage}
                    >
                      ›
                    </button>
                  </>
                )}

              <img
                src={`https://quickrentals-backend.onrender.com${
                  selectedFlat.flatImages?.[currentImageIndex] ||
                  "/uploads/default.jpg"
                }`}
                alt={`${selectedFlat.city} apartment`}
                className={styles.modalImage}
                onError={(e) => {
                  e.target.src =
                    "https://quickrentals-backend.onrender.com/uploads/default.jpg";
                }}
              />

              {selectedFlat.flatImages &&
                selectedFlat.flatImages.length > 1 && (
                  <div className={styles.imageDots}>
                    {selectedFlat.flatImages.map((_, index) => (
                      <span
                        key={index}
                        className={`${styles.dot} ${
                          index === currentImageIndex ? styles.activeDot : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
            </div>

            {/* Detalii apartament */}
            <div className={styles.modalDetails}>
              <h2>{selectedFlat.city}</h2>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <strong>Address:</strong>
                  <p>
                    {selectedFlat.streetName} {selectedFlat.streetNumber}
                  </p>
                </div>

                <div className={styles.detailItem}>
                  <strong>Area:</strong>
                  <p>{selectedFlat.areaSize} m²</p>
                </div>

                <div className={styles.detailItem}>
                  <strong>Price:</strong>
                  <p>${selectedFlat.rentPrice}/month</p>
                </div>

                <div className={styles.detailItem}>
                  <strong>Year Built:</strong>
                  <p>{selectedFlat.yearBuilt}</p>
                </div>

                <div className={styles.detailItem}>
                  <strong>Air Conditioning:</strong>
                  <p>{selectedFlat.hasAc ? "Yes" : "No"}</p>
                </div>

                <div className={styles.detailItem}>
                  <strong>Available From:</strong>
                  <p>{formatDate(selectedFlat.dateAvailable)}</p>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.viewDetailsButton}
                  onClick={() => {
                    closeModal();
                    navigateToFlatDetails(selectedFlat._id);
                  }}
                >
                  View Full Details & Messages
                </button>

                <button
                  className={styles.removeFromFavoritesButton}
                  onClick={(e) => {
                    handleRemoveFavourite(selectedFlat._id);
                    closeModal();
                  }}
                >
                  ❤️ Remove from Favorites
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favourites;
