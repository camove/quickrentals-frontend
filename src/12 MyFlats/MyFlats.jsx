import React, { useState, useEffect, useContext } from "react";
import styles from "./MyFlats.module.css";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import ReusableModal from "../Utils/ReusableModal";
import PaginationControls from "../Utils/PaginationControls";

const MyFlats = () => {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flatToDelete, setFlatToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12 
  });

  useEffect(() => {
    if (!userId || !token) return;

    // Citim valorile din URL
    const pageFromURL = parseInt(searchParams.get('page')) || 1;
    const limitFromURL = parseInt(searchParams.get('limit')) || 12;

    // Actualizam pagination state-ul
    setPagination(prev => ({
      ...prev,
      currentPage: pageFromURL,
      resultsPerPage: limitFromURL
    }));

    // Fetch direct cu valorile din URL
    fetchMyFlatsWithURLParams(pageFromURL, limitFromURL);
  }, [userId, token, searchParams]);

  // FETCH function care folosește parametrii din URL direct
  const fetchMyFlatsWithURLParams = async (page, limit) => {
    // console.log('Fetching my flats - Page:', page, 'Limit:', limit);
    setLoading(true);
    
    try {
      // Build query params cu valorile din URL
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`http://localhost:3000/flats/my-flats?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('My Flats API Response:', data);
        
        const flatsData = data.data || data;
        setFlats(Array.isArray(flatsData) ? flatsData : []);
        
        // UPDATE PAGINATION STATE cu datele din API
        setPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || Math.ceil((flatsData.length || 0) / limit),
          totalResults: data.totalResults || (flatsData.length || 0),
          resultsPerPage: limit
        });
        
        // console.log('My Flats Pagination:', {
        //   currentPage: data.currentPage,
        //   totalPages: data.totalPages,
        //   totalResults: data.totalResults
        // });

      } else if (response.status === 401) {
        toast.error("Authentication required");
        navigate('/login');
      } else {
        console.error('Failed to fetch flats');
        setFlats([]);
        setPagination(prev => ({ ...prev, totalResults: 0, totalPages: 0 }));
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
      setFlats([]);
      setPagination(prev => ({ ...prev, totalResults: 0, totalPages: 0 }));
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
        limit: pagination.resultsPerPage.toString()
      });
    }
  };

  // RESULTS PER PAGE CHANGE
  const handleResultsPerPageChange = (newLimit) => {
    setSearchParams({
      page: '1', // Reset to first page
      limit: newLimit.toString()
    });
  };

  // Open delete confirmation modal
  const openDeleteModal = (flat) => {
    setFlatToDelete(flat);
    setDeleteModalOpen(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setFlatToDelete(null);
  };

  // HANDLE DELETE FLAT
  const handleDeleteFlat = async () => {
    if (!flatToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:3000/flats/${flatToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success("Apartment deleted successfully!");
        closeDeleteModal();
        
        // PAGINATION after delete
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
            limit: pagination.resultsPerPage.toString()
          });
        } else {
          // Refresh current page cu valorile din URL
          const currentPage = parseInt(searchParams.get('page')) || 1;
          const currentLimit = parseInt(searchParams.get('limit')) || 12;
          fetchMyFlatsWithURLParams(currentPage, currentLimit);
        }
        
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete apartment");
      }
    } catch (error) {
      console.error('Error deleting flat:', error);
      toast.error("Failed to delete apartment");
    } finally {
      setDeleting(false);
    }
  };

  // Show loading spinner during initial load
  if (isInitialLoad || (loading && flats.length === 0)) {
    return (
      <div className={styles.container}>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <div className={styles.loadingText}>
            Loading your apartments...
          </div>
        </div>
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

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Apartments</h1>
        <p className={styles.subtitle}>
          Manage your posted apartments ({pagination.totalResults} total)
        </p>
      </div>

      {/* Add New Apartment Button */}
      <div className={styles.addButtonContainer}>
        <NavLink to="/add-flat" className={styles.addButton}>
          + Add New Apartment
        </NavLink>
      </div>

      {/* Empty State */}
      {pagination.totalResults === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏠</div>
          <h2 className={styles.emptyTitle}>No apartments posted yet</h2>
          <p className={styles.emptyMessage}>
            Start by posting your first apartment to connect with potential tenants.
          </p>
          <NavLink to="/add-flat" className={styles.emptyButton}>
            Add Your First Apartment
          </NavLink>
        </div>
      ) : (
        <>
          {/* PAGINATION TOP */}
          {!loading && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onResultsPerPageChange={handleResultsPerPageChange}
              itemName="apartments"
            />
          )}

          {/* Apartments Grid with loading state */}
          <div className={`${styles.flatsGrid} ${loading ? styles.loading : ''}`}>
            {flats.map((flat) => (
              <div key={flat._id} className={styles.flatCard}>
                {/* Image */}
                <div className={styles.imageContainer}>
                  <img
                    src={`http://localhost:3000${flat.flatImages?.[0] || '/uploads/default.jpg'}`}
                    alt={`${flat.city} apartment`}
                    className={styles.flatImage}
                    onError={(e) => {
                      e.target.src = 'http://localhost:3000/uploads/default.jpg';
                    }}
                  />
                  {flat.hasAc && (
                    <div className={styles.acBadge}>❄️ AC</div>
                  )}
                </div>

                {/* Content */}
                <div className={styles.cardContent}>
                  <div className={styles.locationInfo}>
                    <h3 className={styles.cityName}>{flat.city}</h3>
                    <p className={styles.address}>
                      {flat.streetName} {flat.streetNumber}
                    </p>
                  </div>

                  <div className={styles.propertyDetails}>
                    <div className={styles.priceArea}>
                      <span className={styles.price}>€{flat.rentPrice}/month</span>
                      <span className={styles.area}>{flat.areaSize} m²</span>
                    </div>
                    <div className={styles.availableDate}>
                      Available: {new Date(flat.dateAvailable).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.actionButtons}>
                    <NavLink 
                      to={`/flat/${flat._id}`} 
                      className={styles.viewButton}
                    >
                      View Details
                    </NavLink>
                    
                    <div className={styles.bottomButtons}>
                      <button 
                        onClick={() => openDeleteModal(flat)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                      <NavLink 
                        to={`/edit-flat/${flat._id}`}
                        className={styles.editButton}
                      >
                        Edit
                      </NavLink>
                    </div>
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
              itemName="apartments"
            />
          )}
        </>
      )}

      {/* ReusableModal pentru confirmare delete */}
      <ReusableModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteFlat}
        title="Delete Apartment"
        message={
          <>
            Are you sure you want to delete the apartment in{' '}
            <strong>{flatToDelete?.city}</strong> at{' '}
            <strong>{flatToDelete?.streetName} {flatToDelete?.streetNumber}</strong>?
          </>
        }
        warning="This action cannot be undone. All messages and photos related to this apartment will also be deleted."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="delete"
        loading={deleting}
      />
    </div>
  );
};

export default MyFlats;