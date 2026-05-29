import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register'; // Zorg dat de import er staat!
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* De Header staat BUITEN de <Routes>, waardoor hij op elke pagina vast bovenaan blijft staan */}
        <Header />
        
        {/* De hoofdcontent van de website */}
        <main className="main-content">
          <Routes>
            {/* Homepage met de feed, stemmen en nieuwe-post-balk */}
            <Route path="/" element={<Home />} />
            
            {/* Inlogpagina */}
            <Route path="/login" element={<Login />} />
            
            {/* De nieuwe Registratiepagina */}
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;