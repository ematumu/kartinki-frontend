import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch } from '../config'
import PostCard from './PostCard'


function BookmarksPage({ currentUser, onBack, onViewPost, isLoggedIn }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    setLoading(true)
    try {
      const data = await apiFetch(API.posts.bookmarks)
      setPosts(data || [])
    } catch (err) {
      console.error('Error loading bookmarks:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <button onClick={onBack} className="btn-back">
          ← Назад
        </button>
        <h1>Избранное</h1>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <h3>Пока нет избранных постов</h3>
          <p>Сохраняйте посты чтобы увидеть их здесь</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post}
              currentUser={currentUser}
              onClick={() => onViewPost(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BookmarksPage