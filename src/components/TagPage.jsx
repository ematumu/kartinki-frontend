import { useState, useEffect } from 'react'
import { apiFetch } from '../config'
import PostCard from './PostCard'

function TagPage({ tagName, currentUser, onBack, onViewPost, isLoggedIn }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tagName) {
      loadPosts()
    }
  }, [tagName])

  const loadPosts = async () => {
    setLoading(true)
    const rawTags = tagName.split(/\s+/).filter(t => t.trim())
    const lowerTags = rawTags.map(t => t.toLowerCase())

    try {
      if (lowerTags.length === 1) {
        const data = await apiFetch(`/api/tags/${encodeURIComponent(lowerTags[0])}/posts`)
        setPosts(data || [])
      } else if (lowerTags.length > 1) {
        const postsPerTag = await Promise.all(
          lowerTags.map(tag => apiFetch(`/api/tags/${encodeURIComponent(tag)}/posts`).catch(() => []))
        )
        let intersection = postsPerTag[0] || []
        for (let i = 1; i < postsPerTag.length; i++) {
          const otherIds = new Set(postsPerTag[i].map(p => p.id))
          intersection = intersection.filter(post => otherIds.has(post.id))
        }
        setPosts(intersection)
      } else {
        setPosts([])
      }
    } catch (err) {
      console.error(err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tag-page">
      <div className="tag-header">
        <button onClick={onBack} className="btn-back">← Назад</button>
        <h1>#{tagName}</h1>
        <p>{posts.length} постов</p>
      </div>
      {loading ? (
        <div>Загрузка...</div>
      ) : posts.length === 0 ? (
        <div className="empty-feed">
          <h3>Ничего не найдено</h3>
          <p>Посты с тегом #{tagName} не найдены</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={currentUser} onClick={() => onViewPost(post.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TagPage