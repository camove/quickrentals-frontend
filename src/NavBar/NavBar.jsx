import { useContext, useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./NavBar.module.css";
import { AuthContext } from "../Context/AuthContext";
import Logout from "../06 Logout/Logout";
import DeleteAccount from "../07 DeleteAccount/DeleteAccount";
// import SessionEnded from "../Utils/SessionEnded";
import logo from "../assets/Logo.png";
import xMark from "../assets/xmark.svg";
import bars from "../assets/bars.svg";

const NavBar = () => {
  const {
    loggedIn,
    userId,
    setUserId,
    token,
    setToken,
    showWarningModal,
    setShowWarningModal,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Extragem flatId din URL folosind useParams
  const { id: flatId } = useParams();

  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    const savedToken = localStorage.getItem("token");
    if (savedUserId && savedToken && !userId) {
      setUserId(savedUserId);
      setToken(savedToken);
    }
    setIsLoading(false);
  }, [setUserId, setToken, userId, token]);

  useEffect(() => {
    if (isLoading) return;
    const publicPages = ["/login", "/register", "/"];
    const isPublicPage = publicPages.includes(location.pathname);
    if (!userId && !isPublicPage) {
      navigate("/login", { replace: true });
    }
  }, [userId, location, navigate, isLoading]);

  // gestionare stări pentru modalul de logout
  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  // gestionare stări pentru modalul de deleteAccount
  const openDeleteAccountModal = () => {
    setIsDeleteAccountModalOpen(true);
  };

  const closeDeleteAccountModal = () => {
    setIsDeleteAccountModalOpen(false);
  };

  // funcție toggle pentru gestionare stare meniu dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  // gestionăm închiderea meniului dropdown atunci când utilizatorul dă click în afara acestuia
  const handleClickOutside = (event) => {
    // Exclude dropdown button clicks
    if (event.target.closest(`.${styles.dropdownButton}`)) {
      return; // Nu închide nimic dacă click pe dropdown button
    }

    if (event.target.closest(`.${styles.hamburgerButton}`)) {
      return
    }

      setIsMenuOpen(false);
      closeDropdown();  
  };

  // funcție care definește ce se întâmplă la apăsarea butonului Delete Account
  const handleDeleteClick = () => {
    openDeleteAccountModal();
    closeDropdown();
    setIsMenuOpen(false);
  };

  // funcție care definește ce se întâmplă la apăsarea butonului Logout
  const handleLogoutClick = () => {
    openLogoutModal();
    closeDropdown();
    setIsMenuOpen(false);
  };

  // event listener cu apelare funcție handleClickOutside
  useEffect(() => {
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <div className={styles.navBar}>
      {/* Hamburger button - poziționat absolut */}
      <button className={styles.hamburgerButton} onClick={toggleMenu}>
        {isMenuOpen ? (
          <div className={styles.closeIcon}>
            <img src={xMark} alt="Close menu" />
          </div>
        ) : (
          <div className={styles.hamburgerIcon}>
            <img src={bars} alt="Open menu" />
          </div>
        )}
      </button>

      {/* Container principal cu structura pe 2 div-uri în coloană */}
      <div className={styles.navBarMainContainer}>
        {/* DIV SUPERIOR - Navigation și Brand */}
        <div className={styles.topNavContainer}>
          {loggedIn ? (
            <>
              {/* Layout pentru desktop (1201px+) */}
              <div className={styles.desktopNavigation}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/home"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </NavLink>

                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/add-flat"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Add Flat
                </NavLink>

                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/my-flats"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Flats
                </NavLink>

                {/* Brand, Logo și Slogan - centrat */}
                <div className={styles.brandContainer}>
                  <div>
                    <h1>QUICK</h1>
                    <h1>RENTALS</h1>
                  </div>
                  <div>
                    <img className={styles.logo} src={logo} alt="logo" />
                  </div>
                  <div className={styles.slogan}>
                    <h2>Connect.</h2>
                    <h2>Chat.</h2>
                    <h2>Move in.</h2>
                  </div>
                </div>

                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/favourites"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Favourites
                </NavLink>

                {/* Admin menu */}
                {loggedIn.isAdmin === "admin" && (
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? styles.activeNavLink : styles.navLink
                    }
                    to="/all-users"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    All Users
                  </NavLink>
                )}

                {/* Dropdown pentru My Profile */}
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button
                    className={styles.dropdownButton}
                    onClick={toggleDropdown}
                  >
                    My Profile
                  </button>
                  <div
                    className={`${styles.dropdownContent} ${
                      dropdownOpen ? styles.show : ""
                    }`}
                  >
                    <NavLink
                      className={({ isActive }) =>
                        isActive ? styles.activeEditProfile : styles.editProfile
                      }
                      to={`/edit-profile/${userId}`}
                      onClick={() => {
                        closeDropdown();
                        setIsMenuOpen(false);
                      }}
                    >
                      Edit Profile
                    </NavLink>
                    <button onClick={handleDeleteClick}>Delete Account</button>
                    <button onClick={handleLogoutClick}>Logout</button>
                  </div>
                </div>
              </div>

              {/* Layout pentru mobile (sub 1200px) - doar brand */}
              <div className={styles.mobileBrandContainer}>
                <div className={styles.brandTextContainer}>
                  <div>
                    <h1>QUICK RENTALS</h1>
                  </div>
                  <div className={styles.slogan}>
                    <h2>Connect.</h2>
                    <h2>Chat.</h2>
                    <h2>Move in.</h2>
                  </div>
                </div>
                <div>
                  <img className={styles.logo} src={logo} alt="logo" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Layout pentru utilizatori nelogați - desktop */}
              <div className={styles.desktopNavigation}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </NavLink>

                <div className={styles.brandContainer}>
                  <div>
                    <h1>QUICK RENTALS</h1>
                  </div>
                  <div>
                    <img className={styles.logo} src={logo} alt="logo" />
                  </div>
                  <div className={styles.slogan}>
                    <h2>Connect. Chat. Move in.</h2>
                  </div>
                </div>

                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeNavLink : styles.navLink
                  }
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </NavLink>
              </div>

              {/* Layout pentru utilizatori nelogați - mobile */}
              <div className={styles.mobileBrandContainer}>
                <div>
                  <h1>QUICK RENTALS</h1>
                </div>
                <div>
                  <img className={styles.logo} src={logo} alt="logo" />
                </div>
                <div className={styles.slogan}>
                  <h2>Connect. Chat. Move in.</h2>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DIV INFERIOR - Welcome Message */}
        <div className={styles.bottomNavContainer}>
          {loggedIn && (
            <div className={styles.welcomeMessage}>
              <p>
                Welcome, {loggedIn.firstName} {loggedIn.lastName}!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Slide Menu pentru mobile */}
      <div
        className={`${styles.slideMenu} ${isMenuOpen ? styles.showMenu : ""}`}
      >
        {loggedIn ? (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/home"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </NavLink>

            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/add-flat"
              onClick={() => setIsMenuOpen(false)}
            >
              Add Flat
            </NavLink>

            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/my-flats"
              onClick={() => setIsMenuOpen(false)}
            >
              My Flats
            </NavLink>

            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/favourites"
              onClick={() => setIsMenuOpen(false)}
            >
              Favourites
            </NavLink>

            {/* Admin menu */}
            {loggedIn.isAdmin === "admin" && (
              <NavLink
                className={({ isActive }) =>
                  isActive ? styles.activeNavLink : styles.navLink
                }
                to="/all-users"
                onClick={() => setIsMenuOpen(false)}
              >
                All Users
              </NavLink>
            )}

            {/* Dropdown pentru My Profile în slide menu */}
            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={toggleDropdown}
              >
                My Profile
              </button>
              <div
                className={`${styles.dropdownContent} ${
                  dropdownOpen ? styles.show : ""
                }`}
              >
                <NavLink
                  className={({ isActive }) =>
                    isActive ? styles.activeEditProfile : styles.editProfile
                  }
                  to={`/edit-profile/${userId}`}
                  onClick={() => {
                    closeDropdown();
                    setIsMenuOpen(false);
                  }}
                >
                  Edit Profile
                </NavLink>
                <button onClick={handleDeleteClick}>Delete Account</button>
                <button onClick={handleLogoutClick}>Logout</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/login"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </NavLink>

            <NavLink
              className={({ isActive }) =>
                isActive ? styles.activeNavLink : styles.navLink
              }
              to="/register"
              onClick={() => setIsMenuOpen(false)}
            >
              Register
            </NavLink>
          </>
        )}
      </div>

      {/* Modals */}
      <Logout isOpen={isLogoutModalOpen} onClose={closeLogoutModal} />
      <DeleteAccount
        isOpen={isDeleteAccountModalOpen}
        onClose={closeDeleteAccountModal}
      />
      {/* {showWarningModal && (
        <SessionEnded
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
        />
      )} */}
    </div>
  );
};

export default NavBar;
