import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';
import styles from './HomePage.module.css';
import toast, { Toaster } from 'react-hot-toast';
import PaginationControls from '../Utils/PaginationControls';

function HomePage() {
  const { userId, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  //* PAGINATION STATE *//
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12
  });
  
  //* FILTER STATES *//
  const [filters, setFilters] = useState({
    city: '',
    priceRange: '',
    areaSizeRange: ''
  });
  
  //* SORT STATES *//
  const [sortCriteria, setSortCriteria] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  //-> Functie ajutatoare pentru a cauta orasele si fara diacritice
  const normalizeCityName = (cityName) => {
    if (!cityName) return '';
    return cityName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // 
      .trim();
  };

  //-> Util pentru afisarea corecta a elementelor pe pagina (default sau in functie de alegerea utilizatorului - pagina nr... sau nr de elemente de pe pagina)
  useEffect(() => {
    if (!userId || !token) return; //daca nu avem user si token nu face nimic

    // Citim valorile din URL (valori trimise in URL din functia handlePageChange)
    const pageFromURL = parseInt(searchParams.get('page')) || 1;
    const limitFromURL = parseInt(searchParams.get('limit')) || 12;

    // Actualizam pagination state-ul
    setPagination(prev => ({
      ...prev,
      currentPage: pageFromURL,
      resultsPerPage: limitFromURL
    }));

    // Fetch direct cu valorile din URL
    fetchFlatsWithURLParams(pageFromURL, limitFromURL);
  }, [userId, token, searchParams]); // se actualizeaza cand se modifica searchParams (nu pagination pt ca astfel intra in loop)

  //* face FETCH folosind parametrii din URL direct *//
  const fetchFlatsWithURLParams = async (page, limit) => {
    try {
      setIsLoading(true);
      
      // console.log('Fetching apartments - Page:', page, 'Limit:', limit);
      
      // Construim query params cu valorile din URL
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Adaugam filtrele si sortarea din state
      if (filters.city && filters.city.trim()) {
        // filtrarea pentru oras cu normalizare pentru diacritice
        const normalizedCity = filters.city
          .split(',')
          .map(city => normalizeCityName(city.trim()))
          .filter(city => city.length > 0)
          .join(',');
        
        if (normalizedCity) {
          queryParams.append('city', normalizedCity);
        }
      }
      
      // Filtru pentru price range
      if (filters.priceRange && filters.priceRange.trim()) {
        queryParams.append('rentPrice', filters.priceRange.trim());
      }
      
      // Filtru area size range  
      if (filters.areaSizeRange && filters.areaSizeRange.trim()) {
        queryParams.append('areaSize', filters.areaSizeRange.trim());
      }
      
      // Sortare
      if (sortCriteria) {
        const sortString = sortOrder === 'desc' ? `-${sortCriteria}` : sortCriteria;
        queryParams.append('sort', sortString);
      }
      
      const response = await fetch(`http://localhost:3000/flats?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // console.log('API Response:', data);
        
        setFlats(data.data || []);
        setFilteredFlats(data.data || []);
        
        // Update pagination state cu datele din Api
        setPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
          resultsPerPage: limit
        });
        
      } else {
        console.error('Failed to fetch flats');
        toast.error('Failed to load apartments');
        setFlats([]);
        setFilteredFlats([]);
      }
    } catch (error) {
      console.error('Error fetching flats:', error);
      toast.error('Network error. Please try again.');
      setFlats([]);
      setFilteredFlats([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Gestionare filtre si sortare
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSortChange = (e) => {
    setSortCriteria(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  const resetFiltersAndSort = () => {
    setFilters({ city: '', priceRange: '', areaSizeRange: '' });
    setSortCriteria('');
    setSortOrder('asc');
    
    // Reset la pagina 1 si fetch fara filtre
    setSearchParams({
      page: '1',
      limit: pagination.resultsPerPage.toString(),
    });
  };

  // Aplicare filtre (re-fetch cu noii parametri)
  const applyFilters = () => {
    // Reset la pagina 1 cand aplicam filtrele
    setSearchParams({
      page: '1',
      limit: pagination.resultsPerPage.toString(),
      city: filters.city,           
      priceRange: filters.priceRange,
      areaSizeRange: filters.areaSizeRange,
      sortBy: sortCriteria,  
      sortOrder: sortOrder
    });
    // Fetch-ul se va face automat prin useEffect cand se schimba searchParams
    toast.success(`Filters applied!`);
  };

  // Handler pentru schimbarea paginii
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      // Update URL
      setSearchParams({
        page: newPage.toString(),
        limit: pagination.resultsPerPage.toString()
      });
    }
  };

  // Handler pentru numarul de rezultate pe pagina
  const handleResultsPerPageChange = (newLimit) => {
    setSearchParams({
      page: '1', // Reset to first page
      limit: newLimit.toString()
    });
  };

  // Fetch ap favorite pentru afisare corecta a starii unui apartament (favorit sau nu)
  useEffect(() => {
    const fetchUserFavorites = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          const userData = responseData.data || responseData;
          const userFavorites = userData.favouriteFlatList || [];
          const favoriteIds = userFavorites.map(fav => 
            typeof fav === 'string' ? fav : fav._id || fav.id || fav
          );
          setFavorites(new Set(favoriteIds));
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    if (userId && token) {
      fetchUserFavorites();
    }
  }, [userId, token]);

  // TOGGLE pentru apartamente favorite
  const toggleFavorite = async (e, flatId) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`http://localhost:3000/users/favorites/${flatId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(flatId)) {
          newFavorites.delete(flatId);
          toast.success('Removed from favorites');
        } else {
          newFavorites.add(flatId);
          toast.success('Added to favorites');
        }
        setFavorites(newFavorites);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update favorites');
      }
    } catch (error) {
      toast.error('Error updating favorites');
    }
  };

  // Modal
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
      setCurrentImageIndex((prev) => 
        (prev + 1) % selectedFlat.flatImages.length
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Afisare loading spinner
  if (isInitialLoad || (isLoading && flats.length === 0)) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
        <p className={styles.loadingText}>Loading apartments...</p>
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
      
      <h1 className={styles.title}>Available Apartments</h1>
      
      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <h2 className={styles.sectionTitle}>🔍 Filter Options</h2>
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>City</label>
            <input
              type="text"
              name="city"
              placeholder="e.g: Brasov,Cluj-Napoca"
              value={filters.city}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Price Range</label>
            <input
              type="text"
              name="priceRange"
              placeholder="e.g: 500-1500"
              value={filters.priceRange}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Area Size Range</label>
            <input
              type="text"
              name="areaSizeRange"
              placeholder="e.g: 30-100"
              value={filters.areaSizeRange}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
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
              <option value="city">City</option>
              <option value="rentPrice">Price</option>
              <option value="areaSize">Area Size</option>
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
        <button onClick={resetFiltersAndSort} className={styles.resetButton}>
          Reset All
        </button>
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        <span className={styles.resultsCount}>
          Found {pagination.totalResults} apartment{pagination.totalResults !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* PAGINATION - Using reusable component */}
      {!isLoading && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          onResultsPerPageChange={handleResultsPerPageChange}
          itemName="apartments"
        />
      )}

      {/* Grid de carduri */}
      <div className={`${styles.flatsGrid} ${isLoading ? styles.loading : ''}`}>
        {flats.length === 0 ? (
          <div className={styles.noResults}>
            <h3>No apartments found</h3>
            <p>Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          flats.map((flat) => (
            <div
              key={flat._id}
              className={styles.flatCard}
              onClick={() => openModal(flat)}
            >
              <div className={styles.flatImage}>
                <img
                  src={`http://localhost:3000${flat.flatImages?.[0] || '/uploads/default.jpg'}`}
                  alt={`${flat.city} apartment`}
                  onError={(e) => {
                    e.target.src = 'http://localhost:3000/uploads/default.jpg';
                  }}
                />
                <button
                  className={`${styles.favoriteButton} ${favorites.has(flat._id) ? styles.active : ''}`}
                  onClick={(e) => toggleFavorite(e, flat._id)}
                >
                  {favorites.has(flat._id) ? '❤️' : '🤍'}
                </button>
              </div>
              
              <div className={styles.flatContent}>
                <h3 className={styles.flatCity}>{flat.city}</h3>
                <div className={styles.flatDetails}>
                  <span className={styles.flatArea}>{flat.areaSize} m²</span>
                  <span className={styles.flatPrice}>€{flat.rentPrice}/month</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION BOTTOM - Using reusable component */}
      {!isLoading && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          onResultsPerPageChange={handleResultsPerPageChange}
          itemName="apartments"
        />
      )}

      {/* Modal */}
      {selectedFlat && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseButton} onClick={closeModal}>
              ×
            </button>
            
            <div className={styles.imageCarousel}>
              {selectedFlat.flatImages && selectedFlat.flatImages.length > 1 && (
                <>
                  <button className={styles.carouselButton} onClick={prevImage}>
                    ‹
                  </button>
                  <button className={styles.carouselButton} onClick={nextImage}>
                    ›
                  </button>
                </>
              )}
              
              <img
                src={`http://localhost:3000${selectedFlat.flatImages?.[currentImageIndex] || '/uploads/default.jpg'}`}
                alt={`${selectedFlat.city} apartment`}
                className={styles.modalImage}
                onError={(e) => {
                  e.target.src = 'http://localhost:3000/uploads/default.jpg';
                }}
              />
              
              {selectedFlat.flatImages && selectedFlat.flatImages.length > 1 && (
                <div className={styles.imageDots}>
                  {selectedFlat.flatImages.map((_, index) => (
                    <span
                      key={index}
                      className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.modalDetails}>
              <h2>{selectedFlat.city}</h2>
              
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <strong>Address:</strong>
                  <p>{selectedFlat.streetName} {selectedFlat.streetNumber}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Area:</strong>
                  <p>{selectedFlat.areaSize} m²</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Price:</strong>
                  <p>€{selectedFlat.rentPrice}/month</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Year Built:</strong>
                  <p>{selectedFlat.yearBuilt}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Air Conditioning:</strong>
                  <p>{selectedFlat.hasAc ? 'Yes' : 'No'}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Available From:</strong>
                  <p>{formatDate(selectedFlat.dateAvailable)}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <strong>Owner:</strong>
                  <p>{selectedFlat.ownerId?.firstName} {selectedFlat.ownerId?.lastName}</p>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button
                  className={styles.viewDetailsButton}
                  onClick={() => {
                    closeModal();
                    navigate(`/flat/${selectedFlat._id}`);
                  }}
                >
                  View Full Details & Messages
                </button>
                
                <button
                  className={`${styles.modalFavoriteButton} ${favorites.has(selectedFlat._id) ? styles.active : ''}`}
                  onClick={(e) => toggleFavorite(e, selectedFlat._id)}
                >
                  {favorites.has(selectedFlat._id) ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;