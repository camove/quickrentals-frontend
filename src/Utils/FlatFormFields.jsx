import React from 'react';
import styles from './FlatFormFields.module.css'

//* Componenta reutilizabila pentru AddFlat și EditFlat *//
const FlatFormFields = ({ formData = {}, setFormData, errors = {}, validate }) => {
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        
        {/* City */}
        <div className={styles.inputCell}>
          <input 
            type="text" 
            name="city" 
            placeholder="City:" 
            value={formData.city || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.city ? styles.inputError : ''}
          />
          {errors.city && <p className={styles.errorMessage}>{errors.city}</p>}
        </div>

        {/* Street Name */}
        <div className={styles.inputCell}>
          <input 
            type="text" 
            name="streetName" 
            placeholder="Street name:" 
            value={formData.streetName || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.streetName ? styles.inputError : ''}
          />
          {errors.streetName && <p className={styles.errorMessage}>{errors.streetName}</p>}
        </div>

        {/* Street Number */}
        <div className={styles.inputCell}>
          <input 
            type="number" 
            name="streetNumber" 
            placeholder="Street number:" 
            value={formData.streetNumber || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.streetNumber ? styles.inputError : ''}
          />
          {errors.streetNumber && <p className={styles.errorMessage}>{errors.streetNumber}</p>}
        </div>

        {/* Area Size (backend: areaSize) */}
        <div className={styles.inputCell}>
          <input 
            type="number" 
            name="areaSize" 
            placeholder="Size (square meters):" 
            value={formData.areaSize || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.areaSize ? styles.inputError : ''}
          />
          {errors.areaSize && <p className={styles.errorMessage}>{errors.areaSize}</p>}
        </div>

        {/* Has AC Checkbox */}
        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}> 
            <input 
              type="checkbox" 
              name="hasAc" 
              checked={formData.hasAc || false} 
              onChange={setFormData} 
              className={styles.customCheckbox}
            /> 
            <span className={styles.customCheckboxIndicator}></span> 
            Has Air Conditioning
          </label>
          {errors.hasAc && <p className={styles.errorMessage}>{errors.hasAc}</p>}
        </div>

        {/* Year Built (backend: yearBuilt) */}
        <div className={styles.inputCell}>
          <input 
            type="number" 
            name="yearBuilt" 
            placeholder="Year built:" 
            value={formData.yearBuilt || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.yearBuilt ? styles.inputError : ''}
          />
          {errors.yearBuilt && <p className={styles.errorMessage}>{errors.yearBuilt}</p>}
        </div>

        {/* Rent Price (backend: rentPrice) */}
        <div className={styles.inputCell}>
          <input 
            type="number" 
            name="rentPrice" 
            placeholder="Monthly rent price (in Euro):" 
            value={formData.rentPrice || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.rentPrice ? styles.inputError : ''}
          />
          {errors.rentPrice && <p className={styles.errorMessage}>{errors.rentPrice}</p>}
        </div>

        {/* Date Available (backend: dateAvailable) */}
        <div className={styles.inputCell}>
          <label className={styles.dateLabel}>Date available:</label>
          <input 
            type="date" 
            name="dateAvailable" 
            value={formData.dateAvailable || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
            className={errors.dateAvailable ? styles.inputError : ''}
            min={new Date().toISOString().split('T')[0]} // Minimum azi
          />
          {errors.dateAvailable && <p className={styles.errorMessage}>{errors.dateAvailable}</p>}
        </div>

      </div>
    </div>
  );
};

export default FlatFormFields;

