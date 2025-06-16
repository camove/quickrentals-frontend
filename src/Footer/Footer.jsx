import React from 'react';
import styles from './Footer.module.css';
import instagram from "../assets/instagram.svg";
import twitter from "../assets/x-twitter.svg";
import facebook from "../assets/facebook-f.svg";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>Contact Us</h3>
          <div className={styles.contactInfo}>
            <p>📧 contact@quickrentals.com</p>
            <p>📞 +123 456 7890</p>
          </div>
        </div>
        
        <div className={styles.footerSection}>
          <h3>Quick Rentals</h3>
          <p className={styles.tagline}>Connect. Chat. Move in.</p>
        </div>
        
        <div className={styles.footerSection}>
          <h3>Follow Us</h3>
          <div className={styles.socialIcons}>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Facebook"
            >
              <img src={facebook} alt="Facebook" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Twitter"
            >
              <img src={twitter} alt="Twitter" />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Follow us on Instagram"
            >
              <img src={instagram} alt="Instagram" />
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <div className={styles.copyright}>
          &copy; 2025 Quick Rentals. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;