import React, { useState, useEffect } from 'react';
import './Home.css';

function PostCard({ post, onVoteUpdate }) {
  const token = localStorage.getItem('token');
  
  // NIEUW: State om bij te houden of deze specifieke post is uitgeklapt
  const [isExpanded, setIsExpanded] = useState(false);

  // Formateer de datum naar Nederlandse tekst
  const formattedDate = new Date(post.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });

  const handleVote = async (voteValue) => {
    if (!token) {
      alert('Je moet ingelogd zijn om te kunnen stemmen!');
      return;
    }
    const finalValue = post.user_vote === voteValue ? 0 : voteValue;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.id}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ value: finalValue }),
      });
      const data = await response.json();
      if (response.ok) {
        onVoteUpdate(post.id, data.score, data.user_vote);
      }
    } catch (error) {
      console.error('Netwerkfout bij stemmen:', error);
    }
  };

  // =========================================================
  // LOGICA VOOR HET INKORTEN VAN DE TEKST
  // =========================================================
  const CHARACTER_LIMIT = 200; // Pas dit getal aan om de limiet te veranderen
  const isLongPost = post.content.length > CHARACTER_LIMIT;
  
  // Bepaal welke tekst getoond moet worden
  const textToShow = (isLongPost && !isExpanded)
    ? post.content.substring(0, CHARACTER_LIMIT) + '...'
    : post.content;

  return (
    <div className="post-card">
      {/* Stem-sectie links */}
      <div className="post-votes">
        <button 
          className={`vote-btn up ${post.user_vote === 1 ? 'upvoted' : ''}`} 
          onClick={() => handleVote(1)}
        >
          ▲
        </button>
        <span className={`vote-count ${post.user_vote === 1 ? 'text-up' : post.user_vote === -1 ? 'text-down' : ''}`}>
          {post.score}
        </span>
        <button 
          className={`vote-btn down ${post.user_vote === -1 ? 'downvoted' : ''}`} 
          onClick={() => handleVote(-1)}
        >
          ▼
        </button>
      </div>

      {/* Content-sectie rechts */}
      <div className="post-content">
        <p className="post-meta">
          Gepost door <strong>u/{post.author_username}</strong> op {formattedDate}
        </p>
        <h3 className="post-title">{post.title}</h3>
        
        {/* De (ingekorte) body tekst */}
        <p className="post-body-text">{textToShow}</p>

        {/* Toon de handige 'Lees meer' of 'Inklappen' knop als de post te lang is */}
        {isLongPost && (
          <button 
            className="toggle-expand-btn" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▲ Minder weergeven' : '▼ Lees meer'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. SIDEBAR COMPONENT
// ==========================================
function Sidebar() {
  return (
    <aside className="sidebar-card">
      <h3>Populaire Communities</h3>
      <ul>
        <li>r/reactjs</li>
        <li>r/django</li>
        <li>r/webdev</li>
      </ul>
    </aside>
  );
}

// ==========================================
// 3. MAIN HOME COMPONENT (De Feed + Formulier)
// ==========================================
function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States voor het formulier om nieuwe posts te maken
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // NIEUW: State om bij te houden of het formulier is uitgeklapt of compact is
  const [showForm, setShowForm] = useState(false);
  
  const token = localStorage.getItem('token');

  // Haal alle posts op zodra de pagina inlaadt
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const headers = {};
        // Als de gebruiker is ingelogd, sturen we het token mee zodat 
        // Django direct weet wat onze user_vote status is per post
        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }

        const response = await fetch('http://127.0.0.1:8000/api/posts/', { headers });
        const data = await response.json();
        
        if (response.ok) {
          setPosts(data);
        }
      } catch (error) {
        console.error('Fout bij ophalen posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  // Functie om een nieuwe post aan te maken en naar Django te sturen
  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/posts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title: title,
          content: content
        })
      });

      const newPostData = await response.json();

      if (response.ok) {
        // Voeg de zojuist gemaakte post direct bovenaan de lijst toe
        setPosts([newPostData, ...posts]);
        
        // Formulier leegmaken en weer netjes inklappen
        setTitle('');
        setContent('');
        setShowForm(false); 
      } else {
        alert('Er ging iets mis bij het plaatsen van je post.');
      }
    } catch (error) {
      console.error('Netwerkfout bij posten:', error);
    }
  };

  // Werk de score van een specifieke post bij in de React state na een vote
  const handleVoteUpdate = (postId, newScore, newUserVote) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, score: newScore, user_vote: newUserVote } 
          : post
      )
    );
  };

  return (
    <div className="home-container">
      <div className="posts-feed">
        
        {/* CONDITIONAL RENDERING: Formulier tonen OF inlog-oproep tonen */}
        {token ? (
          <div className="create-post-card">
            {!showForm ? (
              // ALS HET FORMULIER GESLOTEN IS: Toon alleen de compacte balk
              <div className="compact-post-trigger" onClick={() => setShowForm(true)}>
                <input type="text" placeholder="Maak een nieuwe post..." readOnly />
                <button className="post-submit-btn">Openen</button>
              </div>
            ) : (
              // ALS HET FORMULIER OPEN IS: Toon de volledige invoervelden
              <div>
                <h3>Maak een nieuwe post</h3>
                <form onSubmit={handleCreatePost}>
                  <input 
                    type="text" 
                    placeholder="Titel van je post" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <textarea 
                    placeholder="Wat wil je delen?..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                  <div className="form-actions">
                    {/* Annuleerknop om het formulier weer in te klappen */}
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={() => setShowForm(false)}
                    >
                      Annuleren
                    </button>
                    <button type="submit" className="post-submit-btn">Posten</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          // ALS DE GEBRUIKER NIET IS INGELOGD: Toon deze vriendelijke melding
          <div className="login-prompt-card">
            <p>Log in om zelf een bericht te plaatsen en te stemmen!</p>
          </div>
        )}

        {/* ALTIJD ZICHTBAAR: De laad-status en de lijst met posts uit de database */}
        {loading && <p>Posts aan het laden uit de database...</p>}
        
        {!loading && posts.length === 0 && (
          <p>Er zijn nog geen posts aanwezig. Maak er eentje aan!</p>
        )}

        {posts.map((backendPost) => (
          <PostCard 
            key={backendPost.id} 
            post={backendPost} 
            onVoteUpdate={handleVoteUpdate} 
          />
        ))}
      </div>

      {/* ALTIJD ZICHTBAAR: De rechter sidebar */}
      <Sidebar />
    </div>
  );
}

export default Home;