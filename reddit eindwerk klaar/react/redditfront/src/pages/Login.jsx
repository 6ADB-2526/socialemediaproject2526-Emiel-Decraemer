import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Netjes geïmporteerd!
import './Login.css'; // Zorg dat je styling hieraan gekoppeld is

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sla het token en de username op in de browser
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);

        alert('Succesvol ingelogd!');
        navigate('/'); // Stuur de gebruiker terug naar de home-feed
        window.location.reload(); // Ververs de pagina om de header direct te updaten
      } else {
        setError(data.non_field_errors || 'Onjuiste gebruikersnaam of wachtwoord.');
      }
    } catch (err) {
      setError('Kan geen verbinding maken met de server.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box"> {/* Witte kaart start */}
        <h2>Inloggen op Reddit</h2>
        <p className="login-subtitle">Welkom terug!</p>

        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>GEBRUIKERSNAAM</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="u/jouwnaam"
              required 
            />
          </div>

          <div className="form-group">
            <label>WACHTWOORD</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Wachtwoord"
              required 
            />
          </div>

          <button type="submit" className="submit-btn">
            Inloggen
          </button>
        </form>

        {/* Deze zin staat nu keurig BINNEN de witte box, onder de knop */}
        <p className="register-redirect-text">
          Nieuw op Reddit? <Link to="/register">Maak hier een account aan</Link>
        </p>

      </div> {/* Witte kaart eindigt */}
    </div>
  );
}

export default Login;