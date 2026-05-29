import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); // Reset eventuele oude foutmeldingen

    try {
      // LET OP: Controleer of deze URL exact overeenkomt met je Django backend!
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Als Django de registratie goedkeurt, loggen we de gebruiker direct in
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);

        alert('Account succesvol aangemaakt!');
        navigate('/'); // Stuur de gebruiker naar de homepage
        window.location.reload(); // Ververs de pagina om de nieuwe login-status te laden
      } else {
        // Toon de foutmelding die uit Django komt (bijv: "Gebruikersnaam bestaat al")
        console.error("Django Registratie Fout:", data);
        setError(data.error || 'Registratie mislukt. Controleer je gegevens.');
      }
    } catch (err) {
      console.error("Netwerkfout:", err);
      setError('Kan geen verbinding maken met de backend server.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Registreren op Reddit</h2>
        <p className="login-subtitle">Word lid van de community!</p>

        {/* Toon de foutmelding in het rood als er iets misgaat */}
        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Gebruikersnaam</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Kies een unieke naam"
              required 
            />
          </div>

          <div className="form-group">
            <label>E-mailadres (optioneel)</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="je@mail.com"
            />
          </div>

          <div className="form-group">
            <label>Wachtwoord</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Minimaal 8 tekens"
              required 
            />
          </div>

          <button type="submit" className="submit-btn">
            Account Aanmaken
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
          Heb je al een account? <Link to="/login" style={{ color: '#0079d3' }}>Log hier in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;