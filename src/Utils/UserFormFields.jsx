import React from 'react';
import styles from './UserFormFields.module.css'
import email from "../assets/envelope.svg";
import lock from "../assets/lock.svg";
import user from "../assets/user.svg";
import { useState } from 'react';

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordPattern = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

//componenta reutilizabila pentru Register si EditProfile; primeste props-urile formData(obiect cu valorile din input), setFormData (functie de actualizare pt formData), errors (obiect cu mesajele de eroare) si validate(functia de validare a campurilor de input)
const UserFormFields = ({ formData = {}, setFormData, errors = {}, validate, hidePasswordFields = false, setErrors }) => {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  //-> Functie pentru verificarea existentei email-ului in baza de date
  const checkEmailExists = async (email) => {
    try {
      const response = await fetch(`http://localhost:3000/users/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      console.log('Email check response:', data);
      
      return data.exists;
    } catch (error) {
      console.error('Email check failed:', error);
      return false; // In caz de eroare, nu se blocheaza utilizatorul ?? de refacut???
    }
  };

  //-> Handler pentru onBlur email
  const handleEmailBlur = async (e) => {
    const emailValue = e.target.value;
    
    console.log('Checking email:', emailValue);
    
    // Ruleaza validarea normala mai intai (format email)
    if (validate) {
      await validate(e);
    }
    
    // Daca formatul email este valid, verifica unicitatea
    if (emailValue && emailPattern.test(emailValue)) {
      setIsCheckingEmail(true);
      
      try {
        const exists = await checkEmailExists(emailValue);
        
        console.log('Email exists:', exists); // Pentru debugging
        
        if (exists) {
          // Actualizeaza errors in componenta parinte
          if (setErrors) {
            setErrors(prevErrors => ({
              ...prevErrors, 
              email: "This email is already registered. Try logging in instead."
            }));
          }
        } else {
          // Sterge eroarea daca email-ul e disponibil
          if (setErrors) {
            setErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors.email;
              return newErrors;
            });
          }
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div className={styles.inputCell}>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="E-mail:" 
            value={formData.email || ''} 
            onChange={setFormData} 
            onBlur={handleEmailBlur}
            disabled={isCheckingEmail}
            required 
          />
          {isCheckingEmail && (
            <div className={styles.loadingText}>Checking email...</div>
          )}
          {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          <div className={styles.inputIcons}>
            <img src={email} alt="Email icon" />
          </div>
        </div>
        
        {/* Restul campurilor raman la fel */}
        {!hidePasswordFields && (
          <>
            <div className={styles.inputCell}>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Password:" 
                value={formData.password || ''} 
                onChange={setFormData} 
                onBlur={validate} 
                required 
              />
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
              <div className={styles.inputIcons}>
                <img src={lock} alt="Password icon" />
              </div>
            </div>
            <div className={styles.inputCell}>
              <input 
                type="password" 
                id="repeatPassword" 
                name="repeatPassword" 
                placeholder="Repeat password:" 
                value={formData.repeatPassword || ''} 
                onChange={setFormData} 
                onBlur={validate} 
                required 
              />
              {errors.repeatPassword && <p className={styles.errorText}>{errors.repeatPassword}</p>}
              <div className={styles.inputIcons}>
                <img src={lock} alt="Password icon" />
              </div>
            </div>
          </>
        )}
        
        <div className={styles.inputCell}>
          <input 
            type="text" 
            id="firstName" 
            name="firstName" 
            placeholder="First Name:" 
            value={formData.firstName || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required
          />
          {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
          <div className={styles.inputIcons}>
            <img src={user} alt="User icon" />
          </div>
        </div>
        <div className={styles.inputCell}>
          <input 
            type="text" 
            id="lastName" 
            name="lastName" 
            placeholder="Last Name:" 
            value={formData.lastName || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required 
          />
          {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
          <div className={styles.inputIcons}>
            <img src={user} alt="User icon" />
          </div>
        </div>
        <div className={styles.inputCell}>
          <input 
            type="date" 
            id="birthDate" 
            name="birthDate" 
            placeholder="Birth Date:" 
            value={formData.birthDate || ''} 
            onChange={setFormData} 
            onBlur={validate} 
            required 
          />
          {errors.birthDate && <p className={styles.errorText}>{errors.birthDate}</p>}
        </div>
      </div>
    </div>
  );
};

export default UserFormFields;