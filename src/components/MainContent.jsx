import { useState, useEffect } from 'react'
import { API, API_BASE } from '../config'
import PostCard from './PostCard'
import Masonry from 'react-masonry-css'
const tags = ['Иллюстрация', 'Цифровое', 'Живопись', 'Фото', 'Скетч', 'Концепт', 'Аниме', 'Фэнтези']

function MainContent({ isLoggedIn, user, feedType, onPostClick, onViewProfile }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(feedType || 'latest')

  useEffect(() => {
    loadPosts()
  }, [activeTab])

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let endpoint = API.posts.list
      
      if (activeTab === 'following') {
        if (!isLoggedIn) {
          setPosts([])
          setError('Войдите, чтобы видеть посты подписок')
          return
        }
        endpoint = API.posts.following
      } else if (activeTab === 'popular') {
        endpoint = API.posts.popular
      }

      const url = `${API_BASE}${endpoint}`

      const headers = {}
      if (isLoggedIn && user?.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`
      }
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setPosts([])
          if (activeTab === 'following') {
            setError('Ошибка авторизации. Попробуйте войти заново')
          }
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setPosts(data || [])
    } catch (err) {
      console.error('Error loading posts:', err)
      setPosts([])
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePostClick = (postId) => {
    if (!isLoggedIn) {
      onPostClick(postId, true)
      return
    }
    onPostClick(postId)
  }

  return (
    <main className="main-content">
          <div className="feed-tabs">
      <button 
        className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
        onClick={() => setActiveTab('latest')}
      >
        Недавнее
      </button>
      
      <button 
        className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
        onClick={() => setActiveTab('popular')}
      >
        Популярное
      </button>
      
      {isLoggedIn && (
        <button 
          className={`tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Подписки
        </button>
      )}
      
      <div className="tags-container">
        {tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <h3>Пока нет постов</h3>
          <p>Будьте первым, кто создаст пост</p>
        </div>
      ) : (
        <Masonry
          breakpointCols={{ default: 3, 1100: 2, 700: 1 }}
          className="masonry-grid"
          columnClassName="masonry-grid-column"
        >
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post}
              currentUser={user}
              onClick={() => handlePostClick(post.id)}
              onViewProfile={onViewProfile}
            />
          ))}
        </Masonry>
      )}
    </main>
  )
}

export default MainContent