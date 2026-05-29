import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'; // Zorg dat je eventuele styling hierin zet

function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    // Wis alle inloggegevens uit de browser
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    alert('Je bent succesvol uitgelogd!');
    navigate('/'); // Stuur de gebruiker terug naar de homepage
    window.location.reload(); // Ververs de pagina om de interface te updaten
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Het logo of de naam van de site die teruglinkt naar home */}
        <Link to="/" className="logo">
          <span className="logo-icon">🧡</span> reddit-clone
        </Link>
      </div>

      <div className="navbar-right">
        {!token ? (
          // ALS DE GEBRUIKER IS UITGELOGD: Toon inlog- en registratieknop
          <div className="auth-buttons">
            <Link to="/login" className="login-nav-btn">Inloggen</Link>
            <Link to="/register" className="register-nav-btn">Registreren</Link>
          </div>
        ) : (
          // ALS DE GEBRUIKER IS INGELOGD: Toon de naam en uitlogknop
          <div className="user-menu">
            <span className="welcome-text">
              Welkom, <strong>u/{username}</strong>
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;