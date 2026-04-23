import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch } from '../config'
import PostCard from './PostCard'

function TagPage({ tagName, currentUser, onBack, onViewPost, isLoggedIn }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tagInfo, setTagInfo] = useState(null)

  useEffect(() => {
    if (tagName) {
      loadTagPosts()
    }
  }, [tagName])

  const loadTagPosts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch(`/api/tags/${encodeURIComponent(tagName)}/posts`)
      setPosts(data || [])
      
      try {
        const tagData = await apiFetch(`/api/tags/search/?q=${encodeURIComponent(tagName)}`)
        const foundTag = tagData.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (foundTag) {
          setTagInfo(foundTag)
        }
      } catch (err) {
        console.error('Error loading tag info:', err)
      }
    } catch (err) {
      console.error('Error loading tag posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tag-page">
      <div className="tag-header">
        <button onClick={onBack} className="btn-back">
          ← Назад
        </button>
        <h1>#{tagName}</h1>
        {tagInfo && (
          <p className="tag-posts-count">
            {tagInfo.posts_count} {tagInfo.posts_count === 1 ? 'пост' : tagInfo.posts_count < 5 ? 'поста' : 'постов'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <h3>Пока нет постов с этим тегом</h3>
          <p>Будьте первым, кто создаст пост с тегом #{tagName}</p>
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

export default TagPage