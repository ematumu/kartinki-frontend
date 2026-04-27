import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'
import searchIcon from '../assets/icons/search.svg'
import userIcon from '../assets/icons/user.svg'
import { getAvatarUrl, API_BASE, apiFetch, API } from '../config'
import './css/MainHeader.css'

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
  const [searchInput, setSearchInput] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
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

    if (searchInput.trim().length < 2) {
      setSearchResults({ users: [], tags: [] })
      setShowSearchResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const [usersData, tagsData] = await Promise.all([
          apiFetch(API.users.search(searchInput)).catch(() => []),
          apiFetch(API.tags.search(searchInput, 10)).catch(() => [])
        ])
        
        const normalizedInput = searchInput.toLowerCase()
        const allTags = tagsData || []
        
        const matchedTags = allTags.filter(tag => 
          tag.name.toLowerCase().includes(normalizedInput)
        )
        
        const filteredTags = matchedTags
          .filter(tag => !selectedTags.some(selected => selected.name === tag.name.toLowerCase()))
          .map(tag => ({
            ...tag,
            name: tag.name.toLowerCase()
          }))
        
        setSearchResults({
          users: usersData || [],
          tags: filteredTags
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
  }, [searchInput, isLoggedIn, selectedTags])

  const addTag = (tag) => {
    const normalizedName = tag.name.toLowerCase()
    if (selectedTags.some(t => t.name === normalizedName)) return
    setSelectedTags([...selectedTags, { name: normalizedName }])
    setSearchInput('')
    setShowSearchResults(false)
  }

  const removeTag = (tagName) => {
    setSelectedTags(selectedTags.filter(t => t.name !== tagName))
  }

  const handleUserSelect = (username) => {
    setSearchInput('')
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

  const performSearch = () => {
    if (!isLoggedIn) {
      if (onSearchAuthRequest) onSearchAuthRequest()
      return
    }
    if (selectedTags.length === 0) return

    const tagsQuery = selectedTags.map(t => t.name).join(' ')
    if (onSearchTag) {
      onSearchTag(tagsQuery)
    } else {
      window.dispatchEvent(new CustomEvent('navigateToTag', {
        detail: { tagName: tagsQuery }
      }))
    }
  }

  const handleSearchFocus = () => {
    if (!isLoggedIn) {
      if (onSearchAuthRequest) onSearchAuthRequest()
      return
    }
    if (searchInput.trim().length >= 2) {
      setShowSearchResults(true)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchInput.trim()) {
        const newTagName = searchInput.trim().toLowerCase()
        if (!selectedTags.some(t => t.name === newTagName)) {
          setSelectedTags([...selectedTags, { name: newTagName }])
        }
        setSearchInput('')
        setShowSearchResults(false)
      } else if (selectedTags.length > 0) {
        performSearch()
      }
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
          <div className="search-wrapper">
            <div className="search-tags-container">
              {selectedTags.map(tag => (
                <div key={tag.name} className="search-tag-chip">
                  <span className="search-tag-hash">#</span>
                  <span className="search-tag-name">{tag.name}</span>
                  <button
                    type="button"
                    className="search-tag-remove"
                    onClick={() => removeTag(tag.name)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder={isLoggedIn ? "Поиск" : "Войдите для поиска"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={handleSearchFocus}
                onKeyPress={handleKeyPress}
                readOnly={!isLoggedIn}
                className="search-input-field"
              />
            </div>
            <button 
              onClick={performSearch}
              className={`search-submit-btn ${selectedTags.length > 0 ? 'active' : ''}`}
              disabled={!isLoggedIn || selectedTags.length === 0}
            >
              <img src={searchIcon} alt="Search" />
              {selectedTags.length > 0 && <span>Найти</span>}
            </button>
          </div>

          {showSearchResults && (searchInput.trim().length >= 2) && isLoggedIn && (
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
                            <span className="search-result-following">Подписан</span>
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
                          onClick={() => addTag(tag)}
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
            <div className="profile-icon" onClick={() => setShowMenu(!showMenu)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.username} />
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
          <div className="profile-icon" onClick={onLoginClick}>
            <span className="profile-icon-placeholder">
              <img src={userIcon} alt="User" />
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

export default MainHeader