import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import ReusableModal from "../Utils/ReusableModal";
import PaginationControls from "../Utils/PaginationControls";
import toast, { Toaster } from "react-hot-toast";
import styles from "./AllUsers.module.css";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    ageRange: "",
    flatsCountRange: "",
    userType: "",
  });
  const [sortCriteria, setSortCriteria] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const { userId: loggedInUserId, loggedIn, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12,
  });

  useEffect(() => {
    if (!token) return;

    // Citim valorile din URL
    const pageFromURL = parseInt(searchParams.get("page")) || 1;
    const limitFromURL = parseInt(searchParams.get("limit")) || 12;

    // Actualizam pagination state-ul
    setPagination((prev) => ({
      ...prev,
      currentPage: pageFromURL,
      resultsPerPage: limitFromURL,
    }));

    // Fetch direct cu valorile din URL
    fetchUsersWithURLParams(pageFromURL, limitFromURL);
  }, [token, searchParams]);

  // FETCH function care foloseste parametrii din URL direct
  const fetchUsersWithURLParams = async (page, limit) => {
    try {
      setLoading(true);

      // Construim query params cu valorile din URL
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Adsugsm filtrele di sortarea din state
      if (filters.userType) queryParams.append("userType", filters.userType);
      if (filters.ageRange) queryParams.append("ageRange", filters.ageRange);
      if (filters.flatsCountRange)
        queryParams.append("flatsCountRange", filters.flatsCountRange);
      if (sortCriteria) {
        const sortString =
          sortOrder === "desc" ? `-${sortCriteria}` : sortCriteria;
        queryParams.append("sort", sortString);
      }

      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // console.log('Users API Response:', data);

        setUsers(data.data || []);

        // PAGINATION STATE
        setPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
          resultsPerPage: limit,
        });
      } else {
        const errorData = await response.json();
        console.error("Error fetching users:", errorData);

        if (response.status === 401) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin rights required.");
          navigate("/home");
        } else {
          toast.error("Failed to load users");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gestionare filtre si sortare
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSortChange = (e) => {
    setSortCriteria(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const resetFiltersAndSort = () => {
    setFilters({ ageRange: "", flatsCountRange: "", userType: "" });
    setSortCriteria("");
    setSortOrder("asc");

    // Reset to page 1 and fetch without filters
    setSearchParams({
      page: "1",
      limit: pagination.resultsPerPage.toString(),
    });
  };

  // Aplicare filtre (re-fetch cu noii parametri)
  const applyFilters = () => {
    // Reset to page 1 when applying filters
    setSearchParams({
      page: "1",
      limit: pagination.resultsPerPage.toString(),
      ageRange: filters.ageRange,
      flatsCountRange: filters.flatsCountRange,
      userType: filters.userType,
      sortBy: sortCriteria,
      sortOrder: sortOrder,
    });

    // Fetch-ul se va face automat prin useEffect cand se schimba searchParams
    toast.success(`Filters applied!`);
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

  // Toggle admin permissions
  const toggleAdminPermissions = async (userId, currentRole) => {
    try {
      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);

        // Update local state
        setUsers((prev) =>
          prev.map((user) =>
            user._id === userId ? { ...user, isAdmin: data.data.isAdmin } : user
          )
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to change user role");
      }
    } catch (error) {
      console.error("Error changing user role:", error);
      toast.error("Network error. Please try again.");
    }
  };

  // Prepare delete user
  const prepareDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Delete user
  const deleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `https://quickrentals-backend.onrender.com/users/${userToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("User deleted successfully");

        // Re-fetch pentru a actualiza paginarea corect
        const currentPage = parseInt(searchParams.get("page")) || 1;
        const currentLimit = parseInt(searchParams.get("limit")) || 12;
        fetchUsersWithURLParams(currentPage, currentLimit);

        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Calculate age from birthDate
  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

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

      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>All Users Management</h1>
      </div>

      {loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <div className={styles.loadingText}>Loading users data... 👥</div>
        </div>
      ) : (
        <>
          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <h2 className={styles.sectionTitle}>🔍 Filter Options</h2>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Age Range</label>
                <input
                  type="text"
                  name="ageRange"
                  placeholder="e.g: 18-65"
                  value={filters.ageRange}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Flats Count</label>
                <input
                  type="text"
                  name="flatsCountRange"
                  placeholder="e.g: 0-10"
                  value={filters.flatsCountRange}
                  onChange={handleFilterChange}
                  className={styles.filterInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>User Type</label>
                <select
                  name="userType"
                  value={filters.userType}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="">All Users</option>
                  <option value="admin">Admin</option>
                  <option value="regular_user">Regular</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sort Section */}
          <div className={styles.sortSection}>
            <h2 className={styles.sectionTitle}>🔄 Sort Options</h2>
            <div className={styles.sortContainer}>
              <div className={styles.sortGroup}>
                <label className={styles.sortLabel}>Sort By</label>
                <select
                  value={sortCriteria}
                  onChange={handleSortChange}
                  className={styles.sortSelect}
                >
                  <option value="">Select...</option>
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="flatsCount">Flats Count</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <button
                onClick={handleSortOrderChange}
                className={styles.sortOrderButton}
                disabled={!sortCriteria}
              >
                {sortOrder === "asc" ? "▲ Ascending" : "▼ Descending"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button onClick={applyFilters} className={styles.applyButton}>
              Apply Filters & Sort
            </button>
            <button
              onClick={resetFiltersAndSort}
              className={styles.resetButton}
            >
              Reset All
            </button>
          </div>

          {/* Results Count */}
          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>
              Found {pagination.totalResults} user
              {pagination.totalResults !== 1 ? "s" : ""}
            </span>
          </div>

          {/* PAGINATION TOP */}
          {pagination.totalResults > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onResultsPerPageChange={handleResultsPerPageChange}
              itemName="users"
            />
          )}

          {/* Users Grid */}
          <div className={styles.gridContainer}>
            <div className={styles.gridHeader}>Name</div>
            <div className={styles.gridHeader}>Email</div>
            <div className={styles.gridHeader}>Age</div>
            <div className={styles.gridHeader}>Role</div>
            <div className={styles.gridHeader}>Flats</div>
            <div className={styles.gridHeader}>Actions</div>

            {users.map((user) => (
              <React.Fragment key={user._id}>
                <div className={styles.gridItem}>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                </div>
                <div className={styles.gridItem}>{user.email}</div>
                <div className={styles.gridItem}>
                  {calculateAge(user.birthDate)}
                </div>
                <div className={styles.gridItem}>
                  <span
                    className={`${styles.roleTag} ${
                      user.isAdmin === "admin"
                        ? styles.adminTag
                        : styles.userTag
                    }`}
                  >
                    {user.isAdmin === "admin" ? "👑 Admin" : "👤 User"}
                  </span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.flatsCount}>
                    {user.flatsCount || 0}
                  </span>
                </div>
                <div className={styles.gridItem}>
                  <div className={styles.actionContainer}>
                    {user._id !== loggedInUserId ? (
                      <>
                        <button
                          onClick={() =>
                            toggleAdminPermissions(user._id, user.isAdmin)
                          }
                          className={`${styles.actionButton} ${styles.roleButton}`}
                        >
                          {user.isAdmin === "admin"
                            ? "Make User"
                            : "Make Admin"}
                        </button>
                        <button
                          onClick={() => prepareDeleteUser(user)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className={styles.currentUserLabel}>
                        Current User
                      </span>
                    )}
                    <NavLink
                      to={`/edit-profile/${user._id}`}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                    >
                      View Profile
                    </NavLink>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile View */}
          <div className={styles.mobileContainer}>
            {users.map((user) => (
              <div key={user._id} className={styles.userCard}>
                <div className={styles.userHeader}>
                  <h3 className={styles.userName}>
                    {user.firstName} {user.lastName}
                  </h3>
                  <span
                    className={`${styles.roleTag} ${
                      user.isAdmin === "admin"
                        ? styles.adminTag
                        : styles.userTag
                    }`}
                  >
                    {user.isAdmin === "admin" ? "👑 Admin" : "👤 User"}
                  </span>
                </div>

                <div className={styles.userInfo}>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Age:</strong> {calculateAge(user.birthDate)}
                  </p>
                  <p>
                    <strong>Flats Posted:</strong> {user.flatsCount || 0}
                  </p>
                </div>

                <div className={styles.userActions}>
                  {user._id !== loggedInUserId ? (
                    <>
                      <button
                        onClick={() =>
                          toggleAdminPermissions(user._id, user.isAdmin)
                        }
                        className={`${styles.actionButton} ${styles.roleButton}`}
                      >
                        {user.isAdmin === "admin" ? "Make User" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => prepareDeleteUser(user)}
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className={styles.currentUserLabel}>
                      Current User
                    </span>
                  )}
                  <NavLink
                    to={`/edit-profile/${user._id}`}
                    className={`${styles.actionButton} ${styles.viewButton}`}
                  >
                    View Profile
                  </NavLink>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION BOTTOM */}
          {pagination.totalResults > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              onResultsPerPageChange={handleResultsPerPageChange}
              itemName="users"
            />
          )}

          {users.length === 0 && (
            <div className={styles.noResults}>
              <h3>No users found</h3>
              <p>Try adjusting your filters or search criteria.</p>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ReusableModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={deleteUser}
        title="Delete User Account"
        message={
          userToDelete ? (
            <>
              Are you sure you want to delete{" "}
              <strong>
                {userToDelete.firstName} {userToDelete.lastName}
              </strong>
              's account permanently?
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
                <li>All their posted apartments</li>
                <li>All their messages</li>
                <li>Their apartments from other users' favorites</li>
                <li>Their profile data</li>
              </ul>
            </>
          ) : (
            ""
          )
        }
        warning="This action cannot be undone. All user data will be permanently deleted from our servers."
        confirmText="Yes, Delete User Account"
        cancelText="Cancel"
        type="delete"
        loading={deleting}
      />
    </div>
  );
};

export default AllUsers;
