import { useState, useEffect } from 'react'
import './App.css'
import MainHeader from "./components/MainHeader"
import MainContent from "./components/MainContent"
import AuthModal from "./components/AuthModal"
import CreatePostModal from "./components/CreatePostModal"
import ProfilePage from "./components/ProfilePage"
import PostPage from "./components/PostPage"
import SettingsPage from "./components/SettingsPage"
import BookmarksPage from "./components/BookmarksPage"
import TagPage from "./components/TagPage"
import { API_BASE } from './config'

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('feed')
  const [viewUsername, setViewUsername] = useState(null)
  const [viewPostId, setViewPostId] = useState(null)
  const [feedType, setFeedType] = useState('latest')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [viewTag, setViewTag] = useState(null)
  const [showSearchAuthPrompt, setShowSearchAuthPrompt] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch {
        localStorage.removeItem('user')
      }
    }
  }, [])

  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('user')
      setUser(null)
      setIsLoggedIn(false)
      setCurrentView('feed')
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [])

  useEffect(() => {
    window.updateGlobalUser = (newUserData) => {
      setUser(prevUser => {
        const updated = { ...prevUser, ...newUserData }
        localStorage.setItem('user', JSON.stringify(updated))
        return updated
      })
    }
    return () => { delete window.updateGlobalUser }
  }, [])

  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail?.username) {
        handleViewProfile(e.detail.username)
      }
    }
    
    window.addEventListener('navigateToProfile', handleNavigate)
    return () => {
      window.removeEventListener('navigateToProfile', handleNavigate)
    }
  }, [])

  useEffect(() => {
    const handleNavigateToTag = (e) => {
      if (e.detail?.tagName) {
        handleSearchTag(e.detail.tagName)
      }
    }
    
    window.addEventListener('navigateToTag', handleNavigateToTag)
    return () => {
      window.removeEventListener('navigateToTag', handleNavigateToTag)
    }
  }, [currentView])

  const openLogin = () => {
    setAuthMode('login')
    setIsAuthModalOpen(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setIsAuthModalOpen(true)
  }

  const closeModal = () => {
    setIsAuthModalOpen(false)
  }

  const handleAuthSuccess = async (userData) => {
    let finalUser = { ...userData }

    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${finalUser.access_token}` }
      })

      if (response.ok) {
        const profile = await response.json()
        finalUser = { ...finalUser, ...profile }
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    }

    localStorage.setItem('user', JSON.stringify(finalUser))
    setUser(finalUser)
    setIsLoggedIn(true)
    
    if (showAuthPrompt && selectedPostId) {
      setShowAuthPrompt(false)
      handleViewPost(selectedPostId)
      setSelectedPostId(null)
    }
    
    if (showSearchAuthPrompt) {
      setShowSearchAuthPrompt(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsLoggedIn(false)
    setCurrentView('feed')
    setRefreshKey(prev => prev + 1)
  }

  const handleCreatePost = () => {
    setIsCreatePostOpen(true)
  }

  const handlePostCreated = () => {
    setIsCreatePostOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleViewProfile = (username) => {
    setViewUsername(username)
    setCurrentView('profile')
  }

  const handleViewPost = (postId) => {
    setViewPostId(postId)
    setCurrentView('post')
  }

  const handlePostClick = (postId, needsAuth = false) => {
    if (needsAuth && !isLoggedIn) {
      setShowAuthPrompt(true)
      setSelectedPostId(postId)
      return
    }
    handleViewPost(postId)
  }

  const handleBackToFeed = () => {
    setCurrentView('feed')
    setViewUsername(null)
    setViewPostId(null)
  }

  const handleSettings = () => {
    setCurrentView('settings')
  }

  const handleBookmarks = () => {
    setCurrentView('bookmarks')
    setViewUsername(null)
    setViewPostId(null)
  }

  const handleSearchTag = (tagName) => {
    setViewTag(tagName)
    setViewUsername(null)
    setViewPostId(null)
    setCurrentView('tag')
  }

  const handleSearchAuthRequest = () => {
    setShowSearchAuthPrompt(true)
  }

  return (
    <div className="app">
      <MainHeader 
        key={user?.avatar_url || user?.id || 'no-avatar'}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={openLogin}
        onRegisterClick={openRegister}
        onLogout={handleLogout}
        onCreatePost={handleCreatePost}
        onViewProfile={handleViewProfile}
        onSettings={handleSettings}
        onBookmarks={handleBookmarks}
        feedType={feedType}
        onFeedTypeChange={setFeedType}
        onSearchTag={handleSearchTag}
        onSearchAuthRequest={handleSearchAuthRequest}
      />

      <div className="main-container">
        {currentView === 'feed' && (
          <MainContent 
            key={refreshKey}
            isLoggedIn={isLoggedIn} 
            user={user}
            feedType={feedType}
            onPostClick={handlePostClick}
            onViewProfile={handleViewProfile}
          />
        )}
        
        {currentView === 'profile' && (
          <ProfilePage 
            key={refreshKey}
            username={viewUsername || user?.username}
            currentUser={user}
            onBack={handleBackToFeed}
            isLoggedIn={isLoggedIn}
            onViewPost={handleViewPost}
          />
        )}
        
        {currentView === 'post' && (
          <PostPage 
            key={refreshKey}
            postId={viewPostId}
            currentUser={user}
            onBack={handleBackToFeed}
            onViewProfile={handleViewProfile}
            onPostDeleted={() => {
              handleBackToFeed()
              setRefreshKey(prev => prev + 1)
            }}
          />
        )}
        
        {currentView === 'bookmarks' && (
          <BookmarksPage 
            key={refreshKey}
            currentUser={user}
            onBack={handleBackToFeed}
            onViewPost={handleViewPost}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentView === 'tag' && (
          <TagPage
            key={refreshKey}
            tagName={viewTag}
            currentUser={user}
            onBack={handleBackToFeed}
            onViewPost={handleViewPost}
            isLoggedIn={isLoggedIn}
          />
        )}
        
        {currentView === 'settings' && (
          <SettingsPage
            user={user}
            onBack={handleBackToFeed}
            onLogout={handleLogout}
          />
        )}
      </div>

      {isAuthModalOpen && (
        <AuthModal 
          mode={authMode}
          onClose={closeModal}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {isCreatePostOpen && (
        <CreatePostModal 
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={handlePostCreated}
          token={user?.access_token}
        />
      )}

      {showAuthPrompt && (
        <div className="auth-prompt-overlay" onClick={() => setShowAuthPrompt(false)}>
          <div className="auth-prompt" onClick={(e) => e.stopPropagation()}>
            
            <div className="auth-prompt-icon">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="var(--text-secondary)" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            
            <h3>Пост доступен только зарегистрированным пользователям</h3>
            <p>Зарегистрируйтесь или войдите, чтобы просматривать посты, ставить лайки и комментировать</p>
            <div className="auth-prompt-buttons">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowAuthPrompt(false)
                  setIsAuthModalOpen(true)
                  setAuthMode('login')
                }}
              >
                Войти
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowAuthPrompt(false)
                  setIsAuthModalOpen(true)
                  setAuthMode('register')
                }}
              >
                Регистрация
              </button>
            </div>
          </div>
        </div>
      )}

      {showSearchAuthPrompt && (
        <div className="auth-prompt-overlay" onClick={() => setShowSearchAuthPrompt(false)}>
          <div className="auth-prompt" onClick={(e) => e.stopPropagation()}>
            
            <div className="auth-prompt-icon">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="var(--text-secondary)" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            
            <h3>Поиск доступен только зарегистрированным пользователям</h3>
            <p>Войдите или зарегистрируйтесь, чтобы искать посты, пользователей и теги</p>
            <div className="auth-prompt-buttons">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowSearchAuthPrompt(false)
                  setIsAuthModalOpen(true)
                  setAuthMode('login')
                }}
              >
                Войти
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowSearchAuthPrompt(false)
                  setIsAuthModalOpen(true)
                  setAuthMode('register')
                }}
              >
                Регистрация
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App