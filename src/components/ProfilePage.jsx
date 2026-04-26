import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch, uploadFile } from '../config'
import Masonry from 'react-masonry-css'

function ProfilePage({ username, currentUser, onBack, isLoggedIn, onViewPost }) {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [listLoading, setListLoading] = useState(false)
  
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [userToRemove, setUserToRemove] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const data = await apiFetch(API.users.profile(username))
      setProfile(data)
      setIsFollowing(data.is_following || false)

      const isOwner = data.is_owner || (currentUser && currentUser.username === username)
      if (isOwner && window.updateGlobalUser) {
        window.updateGlobalUser(data)
      }

      const isPrivate = data.is_private
      const canViewPosts = !isPrivate || isOwner || data.is_following
      
      if (canViewPosts) {
        const postsData = await apiFetch(API.posts.userPosts(username))
        setPosts(postsData || [])
      } else {
        setPosts([])
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFollowers = async () => {
    setListLoading(true)
    try {
      const data = await apiFetch(API.users.followers(username))
      setFollowersList(data || [])
      setShowFollowersModal(true)
    } catch (err) {
      console.error('Error loading followers:', err)
      alert('Не удалось загрузить подписчиков')
    } finally {
      setListLoading(false)
    }
  }

  const loadFollowing = async () => {
    setListLoading(true)
    try {
      const data = await apiFetch(API.users.following(username))
      setFollowingList(data || [])
      setShowFollowingModal(true)
    } catch (err) {
      console.error('Error loading following:', err)
      alert('Не удалось загрузить подписки')
    } finally {
      setListLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      await apiFetch(API.users.follow(username), { method: 'POST' })
      setIsFollowing(true)
      loadProfile()
    } catch (err) {
      console.error('Error following:', err)
      alert('Ошибка подписки')
    }
  }

  const handleUnfollow = async () => {
    try {
      await apiFetch(API.users.follow(username), { method: 'DELETE' })
      setIsFollowing(false)
      loadProfile()
    } catch (err) {
      console.error('Error unfollowing:', err)
      alert('Ошибка отписки')
    }
  }

  const handleRemoveFollowerClick = (user) => {
    setUserToRemove(user)
    setShowRemoveConfirm(true)
  }

  const handleRemoveFollowerConfirm = async () => {
    if (!userToRemove) return
    
    try {
      await apiFetch(API.users.removeFollower(userToRemove.username), { 
        method: 'DELETE'
      })
      
      await loadFollowers()
      await loadProfile()
      
      setShowRemoveConfirm(false)
      setUserToRemove(null)
    } catch (err) {
      console.error('Error removing follower:', err)
      alert('Не удалось удалить подписчика')
      setShowRemoveConfirm(false)
      setUserToRemove(null)
    }
  }

  const handleRemoveFollowerCancel = () => {
    setShowRemoveConfirm(false)
    setUserToRemove(null)
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  if (!profile) {
    return <div className="error">Профиль не найден</div>
  }

  const isOwner = profile.is_owner || (currentUser && currentUser.username === username)
  const isPrivate = profile.is_private
  const canViewPosts = !isPrivate || isOwner || profile.is_following

  return (
    <div className="profile-page-new">
      <div className="profile-banner">
        {isOwner && (
          <button 
            className="edit-profile-btn"
            onClick={() => setShowEditModal(true)}
            title="Редактировать профиль"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        )}

        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-circle">
            {profile.avatar_url || profile.avatar_path ? (
              <img 
                src={
                  profile.avatar_url 
                    ? `${API_BASE}${profile.avatar_url}`
                    : `${API_BASE}/uploads/avatars/${profile.avatar_path}`
                } 
                alt={profile.username}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = `<span>${profile.username[0].toUpperCase()}</span>`
                }}
              />
            ) : (
              <span>{profile.username[0].toUpperCase()}</span>
            )}
          </div>
        </div>
        
        <div className="profile-info-section">
          <div className="profile-nickname-section">
            <h1 className="profile-nickname">{profile.nickname || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
          </div>
          
          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}
          
          <div className="profile-stats-inline">
            <div className="stat-item" onClick={() => setActiveTab('posts')}>
              <div className="stat-value">{profile.posts_count}</div>
              <div className="stat-label">постов</div>
            </div>
            <div className="stat-item" onClick={loadFollowers}>
              <div className="stat-value">{profile.followers_count}</div>
              <div className="stat-label">подписчиков</div>
            </div>
            <div className="stat-item" onClick={loadFollowing}>
              <div className="stat-value">{profile.following_count}</div>
              <div className="stat-label">подписок</div>
            </div>
          </div>
          
          {!isOwner && isLoggedIn && (
            <div className="profile-actions-inline">
              {isFollowing ? (
                <button className="btn btn-secondary" onClick={handleUnfollow}>
                  Отписаться
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleFollow}>
                  {isPrivate ? 'Запросить доступ' : 'Подписаться'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Посты
        </button>
      </div>
      
      {activeTab === 'posts' && (
        <>
          {!canViewPosts ? (
            <div className="private-profile-message">
              <div className="private-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Приватный аккаунт</h3>
              <p>Подпишитесь, чтобы видеть посты</p>
              {!isFollowing && isLoggedIn && (
                <button className="btn btn-primary" onClick={handleFollow}>
                  Запросить доступ
                </button>
              )}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-feed">
              <h3>Пока нет постов</h3>
              {isOwner && <p>Опубликуйте что-нибудь первым</p>}
            </div>
          ) : (
            <Masonry
              breakpointCols={{ default: 3, 1100: 2, 700: 1 }}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {posts.map(post => (
                <div key={post.id} className="post-card" onClick={() => onViewPost(post.id)}>
                  {post.image_path ? (
                    <img 
                      src={`${API_BASE}/uploads/${post.image_path}`} 
                      alt="" 
                      className="post-card-image" 
                    />
                  ) : (
                    <div className="post-card-placeholder">{post.description}</div>
                  )}
                </div>
              ))}
            </Masonry>
          )}
        </>
      )}

      {showEditModal && (
        <EditProfileModal
          user={profile}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
            loadProfile()
          }}
          onUserUpdate={(updatedUser) => {
            if (window.updateGlobalUser) {
              window.updateGlobalUser(updatedUser)
            }
          }}
        />
      )}

      {showFollowersModal && (
        <FollowersModal
          title="Подписчики"
          users={followersList}
          loading={listLoading}
          onClose={() => setShowFollowersModal(false)}
          currentUsername={username}
          onRemoveFollower={handleRemoveFollowerClick}
          isOwner={isOwner}
        />
      )}

      {showFollowingModal && (
        <FollowersModal
          title="Подписки"
          users={followingList}
          loading={listLoading}
          onClose={() => setShowFollowingModal(false)}
          currentUsername={username}
        />
      )}

      {showRemoveConfirm && (
        <div className="auth-prompt-overlay" onClick={handleRemoveFollowerCancel}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="confirm-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            
            <h3>Удалить подписчика?</h3>
            <p>
              Пользователь <strong>@{userToRemove?.username}</strong> будет удалён из ваших подписчиков
            </p>
            
            <div className="confirm-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={handleRemoveFollowerCancel}
              >
                Отмена
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleRemoveFollowerConfirm}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FollowersModal({ title, users, loading, onClose, currentUsername, onRemoveFollower, isOwner }) {
  const handleUserClick = (user) => {
    onClose()
    if (user.username !== currentUsername) {
      window.dispatchEvent(new CustomEvent('navigateToProfile', {
        detail: { username: user.username }
      }))
    }
  }

  const handleRemoveClick = (e, user) => {
    e.stopPropagation()
    if (onRemoveFollower) {
      onRemoveFollower(user)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{title}</h2>
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="empty-feed">
            <p>Пока пусто</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto', padding: '5px' }}>
            {users.map(user => (
              <div 
                key={user.id}
                className="follower-item"
                onClick={() => handleUserClick(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  background: 'var(--bg-primary)',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-accent-light)'
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.transform = 'translateX(5px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-primary)'
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'var(--bg-accent)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid var(--border-color)'
                }}>
                  {user.avatar_path ? (
                    <img 
                      src={`${API_BASE}/uploads/avatars/${user.avatar_path}`}
                      alt={user.username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-accent)'
                    }}>
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.nickname || user.username}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    @{user.username}
                  </div>
                </div>
                
                {isOwner && (
                  <button
                    onClick={(e) => handleRemoveClick(e, user)}
                    className="btn-remove-follower"
                  >
                    Удалить
                  </button>
                )}
                
                <div style={{
                  color: 'var(--text-secondary)',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}>
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSave, onUserUpdate }) {
  const [nickname, setNickname] = useState(user.nickname || '')
  const [bio, setBio] = useState(user.bio || '')
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await apiFetch(API.users.update, {
        method: 'PATCH',
        body: JSON.stringify({
          nickname: nickname || null,
          bio: bio || null,
          is_private: user.is_private
        })
      })

      if (avatar) {
        const formData = new FormData()
        formData.append('file', avatar)
        await uploadFile(API.users.uploadAvatar, formData)
      }

      if (onUserUpdate) {
        onUserUpdate({ ...user, nickname, bio })
      }

      onSave()
    } catch (err) {
      setError(err.message || 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Редактирование профиля</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label></label>
            <div className="upload-area-small" onClick={() => document.getElementById('avatar-input').click()}>
              {preview ? (
                <img src={preview} alt="Preview" />
              ) : user.avatar_url ? (
                <img src={`${API_BASE}${user.avatar_url}`} alt="Current" />
              ) : user.avatar_path ? (
                <img src={`${API_BASE}/uploads/avatars/${user.avatar_path}`} alt="Current" />
              ) : (
                <span>Нажмите для загрузки</span>
              )}
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <input
            type="text"
            placeholder="Никнейм"
            className="auth-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <textarea
            placeholder="О себе"
            className="auth-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage