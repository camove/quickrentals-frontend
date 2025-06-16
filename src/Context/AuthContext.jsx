import React, { createContext, useState, useEffect, useRef } from "react";

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  //-> sessionActive - folosim pentru stergere local storage la repornirea browserului sau la deschidere in tab nou (trebuie relogare)
  const [userId, setUserId] = useState(() => {
    // Verifică dacă există date valide în localStorage, indiferent de sessionActive
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");

    if (storedUserId && storedToken) {
      // Setează sessionActive pentru tab-ul curent
      sessionStorage.setItem("sessionActive", "true");
      return storedUserId;
    }

    return null;
  });

  const [token, setToken] = useState(() => {
    // Aceeași logică pentru token
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");

    if (storedUserId && storedToken) {
      return storedToken;
    }

    return null;
  });

  const [loggedIn, setLoggedIn] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  //-> folosim useRef pentru timer-ul de logout automat (persista intre rerandarile componentelor)
  const logoutTimerRef = useRef(null);

  //-> la incarcarea componentei setam sessionActive = true
  useEffect(() => {
    if (userId && token) {
      sessionStorage.setItem("sessionActive", "true");
    }

    //-> citim datele userId si token
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");

    if (storedUserId && storedToken && !userId && !token) {
      //-> preluam datele din localStorage
      setUserId(storedUserId);
      setToken(storedToken);
      timerLogout();
    } else if (userId && token) {
      //-> doar apelam functia pt pornirea timer-ului, daca deja avem date in useState
      timerLogout();
    }
  }, [userId, token]);

  // // 🎯 HYBRID: Clean up on browser close/tab close
  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     // Only clear sessionStorage, keep localStorage for reload
  //     // sessionStorage.removeItem('sessionActive'); // This happens automatically
  //   };

  //   const handleVisibilityChange = () => {
  //     if (document.hidden) {
  //       // Page is being hidden (potential tab switch or minimize)
  //       // You could implement additional logic here if needed
  //     }
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   document.addEventListener("visibilitychange", handleVisibilityChange);

  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, []);

  //-> Stergere timer la unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  //-> Functie pentru stergere timer
  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  //-> functie pentru a se face logout automat dupa trecerea a 60 minute
  const timerLogout = () => {
    //-> Sterge timer-ul anterior daca exista
    clearLogoutTimer();

    //-> Set timer nou
    logoutTimerRef.current = setTimeout(() => {
      setShowWarningModal(true);
      setLoggedIn(null);
      setUserId(null);
      setToken(null);
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      localStorage.removeItem("loginTime");
      sessionStorage.removeItem("sessionActive");
      logoutTimerRef.current = null; // Reset timer dupa ce acesta s-a executat
    }, 60 * 60 * 1000);
  };

  //-> LOGOUT MANUAL function - pentru a fi folosita în Logout.jsx și alte componente
  const manualLogout = () => {
    //-> stergere timer
    clearLogoutTimer();

    //-> resetam stat-urile
    setLoggedIn(null);
    setUserId(null);
    setToken(null);
    setShowWarningModal(false); // Important: ascunde modalul dacă e deschis

    //-> se sterge local si sessionStorage
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");
    sessionStorage.removeItem("sessionActive");
  };

  //-> hook React care se apeleaza la montarea componentei si ori de cate ori se schimba userId-ul si care preia datele utilizatorului in functie de Id
  useEffect(() => {
    const fetchUserData = async () => {
      // sessionStorage.setItem("sessionActive", "true");

      if (userId && token) {
        try {
          const response = await fetch(
            `http://localhost:3000/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const userData = await response.json();
            setLoggedIn(userData.data);
          } else {
            //-> sterge timer cand tokenul este invalid
            if (logoutTimerRef.current) {
              clearTimeout(logoutTimerRef.current);
              logoutTimerRef.current = null;
            }
            setUserId(null);
            setToken(null);
            setLoggedIn(null);
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            localStorage.removeItem("loginTime");
            sessionStorage.removeItem("sessionActive");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          //-> Sterge timer-ul in caz de eroare
          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
          }
          setUserId(null);
          setToken(null);
          setLoggedIn(null);
          localStorage.removeItem("userId");
          localStorage.removeItem("token");
          localStorage.removeItem("loginTime");
          sessionStorage.removeItem("sessionActive");
        }
      }
    };

    fetchUserData();
  }, [userId, token]);

  //-> in cazul in care se editeaza datele utilizatorului, state-ul loggedIn se actualizeaza cu noile date
  useEffect(() => {
    const handleUserUpdated = (event) => {
      setLoggedIn((prevLoggedIn) => ({
        ...prevLoggedIn,
        ...event.detail,
      }));
    };
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
    };
  }, []);

  //-> Functie pentru login
  const loginUser = async (email, password) => {
    try {
      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const dateNow = new Date();

        //-> Salveaza datele in state si localStorage
        setUserId(data.userToValidate._id);
        setToken(data.token);
        setLoggedIn(data.userToValidate);

        localStorage.setItem("userId", data.userToValidate._id);
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "loginTime",
          dateNow.toLocaleTimeString("en-us", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        timerLogout(); // se apeleaza functia de declansare delogare automata

        return { success: true, user: data.userToValidate };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, message: "Network error: " + error.message };
    }
  };

  //-> Functie pentru register
  const registerUser = async (userData) => {
    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          message: data.message || "Registration failed",
        };
      }
    } catch (error) {
      return { success: false, message: "Network error: " + error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        userId,
        setUserId,
        token,
        setToken,
        timerLogout,
        clearLogoutTimer,
        manualLogout,
        showWarningModal,
        setShowWarningModal,
        loginUser,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
