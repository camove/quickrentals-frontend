import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './LandingPage.module.css';
import PaginationControls from '../Utils/PaginationControls';

const LandingPage = () => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 12
  });

  useEffect(() => {
    const fetchFlats = async () => {
      try {
        setLoading(true);
        
        // Citim parametrii direct din URL
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 12;
        
        // Construim query params
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        });
        
        // console.log(`Fetching: page=${page}, limit=${limit}`);
        
        const response = await fetch(`http://localhost:3000/?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log('Landing API Response:', data);
        
        // Actualizam state-ul cu datele primite
        setFlats(data.data || []);
        setPagination({
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 1,
          totalResults: data.totalResults || 0,
          resultsPerPage: limit // folosim limit-ul din URL, nu din state
        });
        
        setError(null);
      } catch (error) {
        console.error('❌ Error fetching flats:', error);
        setError(`Failed to load properties: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFlats();
  }, [searchParams]); // Doar searchParams ca dependenta

  // PAGE CHANGE HANDLER
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      const currentLimit = searchParams.get('limit') || '12';
      setSearchParams({
        page: newPage.toString(),
        limit: currentLimit
      });
    }
  };

  // RESULTS PER PAGE CHANGE
  const handleResultsPerPageChange = (newLimit) => {
    setSearchParams({
      page: '1',
      limit: newLimit.toString()
    });
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleViewDetails = (flatId) => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Your Perfect Rental Awaits</h1>
          <p className={styles.heroSubtitle}>
            Connect directly with property owners. No agencies, no delays, just results.
          </p>
          <div className={styles.heroButtons}>
            <button 
              className={styles.primaryButton} 
              onClick={handleGetStarted}
            >
              Get Started
            </button>
            <button 
              className={styles.secondaryButton} 
              onClick={handleCreateAccount}
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className={styles.propertiesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Properties</h2>
          <p className={styles.sectionSubtitle}>
            Browse our latest rental listings
          </p>
          
          {/* RESULTS COUNT */}
          {!loading && !error && pagination.totalResults > 0 && (
            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                Showing {pagination.totalResults} propert{pagination.totalResults !== 1 ? 'ies' : 'y'}
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading properties...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* PAGINATION TOP */}
        {!loading && !error && pagination.totalResults > 0 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
            onResultsPerPageChange={handleResultsPerPageChange}
            itemName="properties"
          />
        )}

        {/* Properties Grid */}
        {!loading && !error && (
          <div className={styles.propertiesGrid}>
            {flats.length === 0 ? (
              <div className={styles.noPropertiesContainer}>
                <p className={styles.noPropertiesMessage}>
                  No properties available at the moment.
                </p>
                <button 
                  className={styles.primaryButton}
                  onClick={handleCreateAccount}
                >
                  Be the first to add a property!
                </button>
              </div>
            ) : (
              flats.map((flat) => (
                <div key={flat._id} className={styles.propertyCard}>
                  <div className={styles.imageContainer}>
                    {flat.mainImage ? (
                      <img
                        src={
                          flat.mainImage.startsWith('/uploads/') 
                            ? `http://localhost:3000${flat.mainImage}`
                            : `http://localhost:3000/uploads/${flat.mainImage}`
                        }
                        alt={`Property in ${flat.city}`}
                        className={styles.propertyImage}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop&crop=center';
                        }}
                      />
                    ) : (
                      <div className={styles.noImagePlaceholder}>
                        <span>🏠</span>
                        <p>No Image</p>
                      </div>
                    )}
                    <div className={styles.priceTag}>
                      €{flat.rentPrice}/month
                    </div>
                  </div>
                  
                  <div className={styles.propertyInfo}>
                    <h3 className={styles.propertyTitle}>
                      Property in {flat.city}
                    </h3>
                    <button 
                      className={styles.viewDetailsButton}
                      onClick={() => handleViewDetails(flat._id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PAGINATION BOTTOM */}
        {!loading && !error && pagination.totalResults > 0 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={handlePageChange}
            onResultsPerPageChange={handleResultsPerPageChange}
            itemName="properties"
          />
        )}
      </section>

      {/* Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Find Your New Home?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of satisfied tenants and property owners
          </p>
          <button 
            className={styles.primaryButton}
            onClick={handleCreateAccount}
          >
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;