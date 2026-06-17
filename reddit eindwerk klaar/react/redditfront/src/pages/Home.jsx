import React, { useState, useEffect } from 'react';
import './Home.css';

// =========================================================
// 1. DE POSTCARD COMPONENT (Volledig foutveilig)
// =========================================================
function PostCard({ post, onVoteUpdate, onPostDelete }) {
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const formattedDate = post?.created_at 
    ? new Date(post.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '';

  const confirmDelete = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/posts/${post.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        setShowDeleteModal(false);
        onPostDelete(post.id);
      } else {
        alert('Je bent niet geautoriseerd om dit bericht te verwijderen.');
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Fout bij verwijderen:', error);
      setShowDeleteModal(false);
    }
  };

  const handleVote = async (voteValue) => {
    // Als de gebruiker niet is ingelogd, tonen we de custom pop-up in plaats van de oude alert
    if (!token) {
      setShowAuthModal(true);
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
      console.error('Fout bij stemmen:', error);
    }
  };

 const handleHide = async (postId) => {
  try {
    const token = localStorage.getItem('user_token'); 
    
    console.log("Gevonden token voor verbergen:", token); // Dit print de token in je console zodat je ziet of het werkt

    const response = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/hide/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // Zorg dat Bearer met een spatie voor de token staat
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, is_hidden: data.is_hidden } : post
      ));
    } else {
      alert(`Er ging iets mis (${response.status}).`);
    }
  } catch (error) {
    console.error("Netwerkfout bij verbergen:", error);
  }
};

  // --- GLITCH-VRIJE LEES MEER LOGICA ---
  const CHARACTER_LIMIT = 200;
  const LINE_LIMIT = 4;
  const contentText = post?.content || '';
  const enterCount = (contentText.match(/\n/g) || []).length;
  const isLongPost = contentText.length > CHARACTER_LIMIT || enterCount > LINE_LIMIT;

  let textToShow = contentText;
  if (isLongPost && !isExpanded) {
    if (contentText.length > CHARACTER_LIMIT) {
      textToShow = contentText.substring(0, CHARACTER_LIMIT) + '...';
    } else {
      const lines = contentText.split('\n');
      textToShow = lines.slice(0, LINE_LIMIT).join('\n') + '\n...';
    }
  }

  return (
    <div className="post-card">
      {/* Stemmen Kolom */}
      <div className="post-votes">
        <button className={`vote-btn up ${post.user_vote === 1 ? 'upvoted' : ''}`} onClick={() => handleVote(1)}>▲</button>
        <span className={`vote-count ${post.user_vote === 1 ? 'text-up' : post.user_vote === -1 ? 'text-down' : ''}`}>
          {post.score !== undefined && post.score !== null ? post.score : 0}
        </span>        <button className={`vote-btn down ${post.user_vote === -1 ? 'downvoted' : ''}`} onClick={() => handleVote(-1)}>▼</button>
      </div>

      {/* Content Kolom */}
      <div className="post-content">
        <div className="post-header-container">
          <p className="post-meta">
            Gepost door <strong>u/{post?.author_username || 'onbekend'}</strong> op {formattedDate}
          </p>
          
          {/* VEILIGE CHECK: Voorkomt .toLowerCase() crashes als je bent uitgelogd */}
          {localStorage.getItem('username') === post.author_username && (
  <div className="post-actions">
    <button 
  className="delete-btn" 
  onClick={() => handleDelete(post.id)}
  style={{ backgroundColor: '#f0f2f4', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: '#cc0000' }}
>
  🗑️ Verwijderen
</button>
    
    <button 
      className={`hide-btn ${post.is_hidden ? 'is-hidden-active' : ''}`} 
      onClick={() => handleHide(post.id)}
      style={{ marginLeft: '8px' }}
    >
      {post.is_hidden ? "👁️ Zichtbaar maken" : "🔒 Onzichtbaar maken"}
    </button>
  </div>
)}
        </div>

        <h3 className="post-title">{post?.title || 'Geen titel'}</h3>
        <p className="post-body-text">{textToShow}</p>

        {isLongPost && (
          <button className="toggle-expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '▲ Minder weergeven' : '▼ Lees meer'}
          </button>
        )}

        {/* Foto Weergave */}
        {post?.image && (
          <div className="post-image-container">
            <img src={post.image} alt={post.title || 'Post afbeelding'} className="post-attached-image" />
          </div>
        )}
      </div>

      {/* CUSTOM DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h2>Bericht verwijderen?</h2>
            <p>Weet je zeker dat je jouw bericht wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Annuleren</button>
              <button className="modal-btn-confirm" onClick={confirmDelete}>Verwijderen</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM AUTH/LOGIN REQUIRED MODAL */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-icon">🚀</div>
            <h2>Wil je meestemmen?</h2>
            <p>Log in of maak een account aan om posts te upvoten, te downvoten of zelf content te delen met de community.</p>
            <div className="modal-actions auth-actions">
              <button className="modal-btn-cancel" onClick={() => setShowAuthModal(false)}>Nu niet</button>
              <a href="/login" className="modal-btn-login">Inloggen</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// 2. DE SIDEBAR COMPONENT
// =========================================================
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

// =========================================================
// 3. DE HOOFDCOMPONENT (Home)
// =========================================================
function Home() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const headers = {};
    if (token) { headers['Authorization'] = `Token ${token}`; }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/posts/', { headers });
      const data = await response.json();
      // Zorg ervoor dat data altijd een array is om runtime errors te voorkomen
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fout bij ophalen posts:', error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    // Formulier opbouwen als FormData vanwege de afbeelding
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/posts/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        setTitle('');
        setContent('');
        setImage(null);
        setIsFormOpen(false);
        fetchPosts(); // Ververs de feed
      }
    } catch (error) {
      console.error('Fout bij posten:', error);
    }
  };

const handleVoteUpdate = (postId, newScore, newUserVote) => {
  setPosts(prevPosts => 
    prevPosts.map(post => {
      if (post.id === postId) {
        // We updaten de score én het user_vote type, en loggen het even in de console voor de zekerheid
        console.log(`Post ${postId} geüpdatet naar score:`, newScore);
        return { 
          ...post, 
          score: newScore, 
          user_vote: newUserVote 
        };
      }
      return post;
    })
  );
};

  return (
    <div className="home-container">
      <div className="main-feed">
        {token && (
          <div className="create-post-container">
            {!isFormOpen ? (
              <div className="fake-input" onClick={() => setIsFormOpen(true)}>Maak een nieuwe post...</div>
            ) : (
              <form onSubmit={handleCreatePost} className="real-form">
                <input type="text" placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <textarea placeholder="Wat wil je delen?" value={content} onChange={(e) => setContent(e.target.value)} required />
                
                <div className="file-upload-wrapper">
                  <label htmlFor="file-upload" className="custom-file-upload">
                    🖼️ Foto toevoegen
                  </label>
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImage(e.target.files[0])} 
                  />
                  {image && <span className="file-name">Geselecteerd: {image.name}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => { setIsFormOpen(false); setImage(null); }}>Annuleren</button>
                  <button type="submit" className="btn-submit">Posten</button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="posts-list">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onVoteUpdate={handleVoteUpdate} 
                onPostDelete={(deletedId) => setPosts(posts.filter(p => p.id !== deletedId))} 
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#7c7c7c', marginTop: '20px' }}>Er zijn nog geen berichten geplaatst.</p>
          )}
        </div>
      </div>
      <Sidebar />
    </div>
  );
}

export default Home;