import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'
import searchIcon from '../assets/icons/search.svg'
import userIcon from '../assets/icons/user.svg'
import { getAvatarUrl, API_BASE, apiFetch, API } from '../config'

function MainHeader({ 
  isLoggedIn, 
  user, 
  onLoginClick, 
  onRegisterClick, 
  onLogout, 
  onCreatePost, 
  onViewProfile, 
  onSettings, 
  onBookmarks, 
  feedType, 
  onFeedTypeChange, 
  onSearchTag,
  onSearchAuthRequest
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ users: [], tags: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  const searchRef = useRef(null)
  const avatarUrl = getAvatarUrl(user)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setSearchResults({ users: [], tags: [] })
      setShowSearchResults(false)
      return
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults({ users: [], tags: [] })
      setShowSearchResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const [usersData, tagsData] = await Promise.all([
          apiFetch(API.users.search(searchQuery)).catch(() => []),
          apiFetch(API.tags.search(searchQuery, 5)).catch(() => [])
        ])
        
        setSearchResults({
          users: usersData || [],
          tags: tagsData || []
        })
        setShowSearchResults(true)
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults({ users: [], tags: [] })
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isLoggedIn])

  const handleUserSelect = (username) => {
    setSearchQuery('')
    setSearchResults({ users: [], tags: [] })
    setShowSearchResults(false)
    
    if (onViewProfile) {
      onViewProfile(username)
    } else {
      window.dispatchEvent(new CustomEvent('navigateToProfile', {
        detail: { username }
      }))
    }
  }

  const handleTagSelect = (tagName) => {
    setSearchQuery('')
    setSearchResults({ users: [], tags: [] })
    setShowSearchResults(false)
    
    if (onSearchTag) {
      onSearchTag(tagName)
    } else {
      window.dispatchEvent(new CustomEvent('navigateToTag', {
        detail: { tagName }
      }))
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    
    if (!isLoggedIn) {
      if (onSearchAuthRequest) {
        onSearchAuthRequest()
      }
      return
    }
    
    if (searchResults.users.length > 0) {
      handleUserSelect(searchResults.users[0].username)
    } else if (searchResults.tags.length > 0) {
      handleTagSelect(searchResults.tags[0].name)
    }
  }

  const handleSearchFocus = () => {
    if (!isLoggedIn) {
      if (onSearchAuthRequest) {
        onSearchAuthRequest()
      }
      return
    }
    if (searchQuery.trim().length >= 2) {
      setShowSearchResults(true)
    }
  }

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo" onClick={() => window.location.reload()}>
          <img src={logo} alt="Нить" />
        </div>
      </div>

      <div className="header-center">
        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%' }}>
            <input
              type="text"
              placeholder={isLoggedIn ? "Поиск" : "Войдите для поиска"}
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              readOnly={!isLoggedIn}
              style={!isLoggedIn ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={!isLoggedIn}
              style={!isLoggedIn ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
            >
              <img src={searchIcon} alt="Search" />
            </button>
          </form>

          {showSearchResults && (searchQuery.trim().length >= 2) && isLoggedIn && (
            <div className="search-results-dropdown">
              {searchLoading ? (
                <div className="search-loading">Поиск...</div>
              ) : searchResults.users.length === 0 && searchResults.tags.length === 0 ? (
                <div className="search-no-results">Ничего не найдено</div>
              ) : (
                <div className="search-results-list">
                  {searchResults.users.length > 0 && (
                    <>
                      <div className="search-section-title">Пользователи</div>
                      {searchResults.users.map(userItem => (
                        <button
                          key={userItem.id}
                          className="search-result-item"
                          onClick={() => handleUserSelect(userItem.username)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="search-result-avatar">
                            {userItem.avatar_path ? (
                              <img 
                                src={`${API_BASE}/uploads/avatars/${userItem.avatar_path}`} 
                                alt={userItem.username}
                              />
                            ) : (
                              <span>{userItem.username?.[0]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="search-result-info">
                            <span className="search-result-nickname">
                              {userItem.nickname || userItem.username}
                            </span>
                            <span className="search-result-username">@{userItem.username}</span>
                          </div>
                          {userItem.is_following && (
                            <span className="search-result-following">✓ Подписан</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}

                  {searchResults.tags.length > 0 && (
                    <>
                      <div className="search-section-title">Теги</div>
                      {searchResults.tags.map(tag => (
                        <button
                          key={tag.id}
                          className="search-result-item search-tag-item"
                          onClick={() => handleTagSelect(tag.name)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="search-tag-icon">#</div>
                          <div className="search-result-info">
                            <span className="search-result-nickname search-tag-name">
                              {tag.name}
                            </span>
                            <span className="search-result-username">
                              {tag.posts_count} {tag.posts_count === 1 ? 'пост' : tag.posts_count < 5 ? 'поста' : 'постов'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {isLoggedIn ? (
          <>
            <div className="profile-icon" onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="profile-icon-placeholder">{user?.username?.[0]?.toUpperCase()}</span>
              )}
            </div>
            
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={() => { onCreatePost(); setShowMenu(false); }}>Создать пост</button>
                <button onClick={() => { onViewProfile(); setShowMenu(false); }}>Профиль</button>
                <button onClick={() => { onBookmarks(); setShowMenu(false); }}>Избранное</button>
                <button onClick={() => { onSettings(); setShowMenu(false); }}>Настройки</button>
                <button onClick={() => { onLogout(); setShowMenu(false); }} className="logout">Выйти</button>
              </div>
            )}
          </>
        ) : (
          <div className="profile-icon" onClick={onLoginClick} style={{ cursor: 'pointer' }}>
            <span className="profile-icon-placeholder">
              <img src={userIcon} alt="User" style={{width: '24px', height: '24px'}} />
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

export default MainHeader