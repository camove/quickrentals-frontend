import React from 'react';
import styles from './PaginationControls.module.css';

const PaginationControls = ({ 
  pagination, 
  onPageChange, 
  onResultsPerPageChange,
  itemName = "items" // "apartments", "favorites", etc.
}) => {
  const { currentPage, totalPages, totalResults, resultsPerPage } = pagination;
  
  //-> Daca avem o singura pagina, nu se afiseaza numarul de pagini
  const showPageNumbers = totalPages > 1;

  const getPageNumbers = () => {
    const delta = 2; // cate pagini arara in stanga si in dreapta paginii curente
    const range = [];
    const rangeWithDots = [];

    //-> range pt a determina ce se afiseaza in stanga si dreapta paginii curente
    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    //-> logica pentru afisare "..."
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={styles.paginationContainer}>
      {/* info rezultate pe pagina */}
      <div className={styles.paginationInfo}>
        Showing {Math.min(resultsPerPage, totalResults)} of {totalResults} {itemName}
      </div>

      {/* Butoane pt controlul paginii */}
      {showPageNumbers && (
        <div className={styles.paginationControls}>
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${styles.paginationButton} ${styles.paginationPrev}`}
          >
            ← Previous
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className={styles.paginationEllipsis}>...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`${styles.paginationButton} ${
                    page === currentPage ? styles.paginationActive : ''
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${styles.paginationButton} ${styles.paginationNext}`}
          >
            Next →
          </button>
        </div>
      )}

      {/* Results per page */}
      <div className={styles.resultsPerPage}>
        <label>Per page:</label>
        <select
          value={resultsPerPage}
          onChange={(e) => onResultsPerPageChange(parseInt(e.target.value))}
          className={styles.resultsPerPageSelect}
        >
          <option value={6}>6</option>
          <option value={12}>12</option>
          <option value={24}>24</option>
          <option value={48}>48</option>
        </select>
      </div>
    </div>
  );
};

export default PaginationControls;