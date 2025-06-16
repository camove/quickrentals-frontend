import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Error404.module.css';
import { AuthContext } from '../Context/AuthContext';

const Error404 = () => {
  const { userId, loggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  //-> Array cu mesaje 
  const funMessages = [
    "Oops! This page went house hunting and never came back! 🏠",
    "404: Home not found! But we can help you find a real one! 🔍",
    "This page is as elusive as finding the perfect apartment! 🏚️",
    "Looks like you've wandered into the digital wilderness! 🌲",
    "Page missing in action! Let's get you back to your search! 🕵️",
    "Error 404: This page moved out without leaving a forwarding address! 📮"
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  //-> Schimbă mesajele la fiecare 3 secunde
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % funMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  //-> Countdown pentru redirect automat
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect logic
          if (loggedIn && userId) {
            navigate('/home');
          } else {
            navigate('/');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, loggedIn, userId]);

  const handleGoHome = () => {
    if (loggedIn && userId) {
      navigate('/home');
    } else {
      navigate('/');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.errorCode}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>0</span>
          <span className={styles.four}>4</span>
        </div>
        
        <h1 className={styles.title}>Page Not Found!</h1>
        
        <div className={styles.messageContainer}>
          <p className={styles.message}>
            {funMessages[currentMessage]}
          </p>
        </div>

        <div className={styles.illustration}>
          <div className={styles.house}>🏠</div>
          <div className={styles.searchIcon}>🔍</div>
        </div>

        <div className={styles.suggestions}>
          <h3>What can you do?</h3>
          <ul>
            <li>✅ Check the URL for typos</li>
            <li>🏠 Go back to your home search</li>
            <li>🔍 Use our search feature</li>
            <li>📞 Contact our support team</li>
          </ul>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            className={styles.backButton}
            onClick={handleGoBack}
          >
            ← Go Back
          </button>
          
          <NavLink 
            className={styles.homeButton}
            to={loggedIn && userId ? '/home' : '/'}
            onClick={handleGoHome}
          >
            🏠 Take Me Home
          </NavLink>
        </div>

        <div className={styles.autoRedirect}>
          <p>Automatically redirecting in <span className={styles.countdown}>{countdown}</span> seconds...</p>
          <div className={styles.progressBar}>
            <div 
              className={styles.progress} 
              style={{ width: `${(10 - countdown) * 10}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Floating elements pentru ambiance */}
      <div className={styles.floatingElements}>
        <span className={styles.float1}>🏡</span>
        <span className={styles.float2}>🔑</span>
        <span className={styles.float3}>🚪</span>
        <span className={styles.float4}>🪟</span>
        <span className={styles.float5}>🌟</span>
      </div>
    </div>
  );
};

export default Error404;