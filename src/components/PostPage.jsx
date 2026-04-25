import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch } from '../config'
import heartOutline from '../assets/icons/heart-outline.svg'
import heartFilled from '../assets/icons/heart-filled.svg'
import commentIcon from '../assets/icons/comment.svg'
import bookmarkOutline from '../assets/icons/bookmark-outline.svg'
import bookmarkFilled from '../assets/icons/bookmark-filled.svg'
import moreIcon from '../assets/icons/more.svg'
import CommentsPanel from './CommentsPanel'

function PostPage({ postId, currentUser, onBack, onViewProfile, onPostDeleted }) {
  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showActions, setShowActions] = useState(false)
  const [liking, setLiking] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)
  
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    setLoading(true)
    try {
      const data = await apiFetch(API.posts.byId(postId))
      setPost(data)
      setLikesCount(data.likes_count || 0)
      setIsLiked(data.is_liked || false)
      setIsBookmarked(data.is_bookmarked || false)
      setCommentsCount(data.comments_count || 0)
      
      if (data.author_username) {
        const authorData = await apiFetch(API.users.profile(data.author_username))
        setAuthor(authorData)
      }
    } catch (err) {
      console.error('Error loading post:', err)
      alert('Пост не найден')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser) {
      alert('Войдите, чтобы поставить лайк')
      return
    }

    setLiking(true)
    try {
      if (isLiked) {
        await apiFetch(API.posts.like(postId), { method: 'DELETE' })
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        await apiFetch(API.posts.like(postId), { method: 'POST' })
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error liking post:', err)
    } finally {
      setLiking(false)
    }
  }

  const handleBookmark = async () => {
    if (!currentUser) {
      alert('Войдите, чтобы добавить в избранное')
      return
    }

    setBookmarking(true)
    try {
      if (isBookmarked) {
        await apiFetch(API.posts.bookmark(postId), { method: 'DELETE' })
        setIsBookmarked(false)
      } else {
        await apiFetch(API.posts.bookmark(postId), { method: 'POST' })
        setIsBookmarked(true)
      }
    } catch (err) {
      console.error('Error bookmarking post:', err)
      alert(err.message)
    } finally {
      setBookmarking(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Удалить этот пост?')) return
    
    try {
      await apiFetch(API.posts.delete(postId), { method: 'DELETE' })
      onPostDeleted()
    } catch (err) {
      console.error('Error deleting post:', err)
      alert('Ошибка удаления')
    }
  }

  if (loading) {
    return <div className="loading">Загрузка...</div>
  }

  if (!post) {
    return <div className="error">Пост не найден</div>
  }

  const imageUrl = post.image_path 
    ? `${API_BASE}/uploads/${post.image_path}`
    : null

  const isOwner = currentUser && currentUser.user_id === post.user_id

  const avatarUrl = author?.avatar_url 
    ? `${API_BASE}${author.avatar_url}` 
    : author?.avatar_path 
      ? `${API_BASE}/uploads/avatars/${author.avatar_path}`
      : null

  return (
    <div className="post-page">
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Назад
      </button>
      
      <div className="post-view">
        <div className="post-view-image-container">
          {imageUrl ? (
            <img src={imageUrl} alt={post.description} className="post-view-image" />
          ) : (
            <div className="post-view-placeholder">
              {post.description || 'Пост'}
            </div>
          )}
        </div>
        
        <div className="post-view-content">
          <div className="post-view-header">
            <div 
              className="post-author-avatar" 
              onClick={() => author && onViewProfile(author.username)}
              style={{ cursor: 'pointer' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={author.username} />
              ) : (
                <span>{author?.username?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 
                className="author-name"
                onClick={() => author && onViewProfile(author.username)}
                style={{ cursor: 'pointer' }}
              >
                {author?.nickname || author?.username}
              </h3>
              <p className="author-username">@{author?.username}</p>
            </div>
          </div>
          
          {post.description && (
            <div className="post-view-description">
              {post.description}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              marginTop: '15px',
              marginBottom: '15px'
            }}>
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--bg-accent)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  #{typeof tag === 'object' ? tag.name : tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="post-view-stats">
            <span>{likesCount} лайков</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          
        <div className="post-view-actions">
          <button 
            className={`action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={liking}
          >
            <img 
              src={isLiked ? heartFilled : heartOutline} 
              alt="Like"
              className={liking ? 'like-animation' : ''}
            />
            <span>{likesCount}</span>
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setShowCommentsPanel(true)}
          >
            <img src={commentIcon} alt="Comment" />
            <span>Комментарии ({commentsCount})</span>
          </button>
          
          <button 
            className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmark}
            disabled={bookmarking}
          >
            <img 
              src={isBookmarked ? bookmarkFilled : bookmarkOutline} 
              alt="Bookmark"
              className={bookmarking ? 'like-animation' : ''}
            />
            <span>{isBookmarked ? 'В избранном' : 'В избранное'}</span>
          </button>
          
          {/* ← КНОПКА ТОЛЬКО ДЛЯ АВТОРА */}
          {isOwner && (
            <div style={{ position: 'relative' }}>
              <button 
                className="action-btn" 
                onClick={() => setShowActions(!showActions)}
              >
                <img src={moreIcon} alt="More" />
              </button>
              
              {showActions && (
                <div className="dropdown-menu" style={{ top: '40px', right: '0' }}>
                  <button onClick={handleDelete} style={{ color: '#d4a5a5' }}>
                    Удалить пост
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {showCommentsPanel && (
        <CommentsPanel
          postId={postId}
          currentUser={currentUser}
          onClose={() => setShowCommentsPanel(false)}
        />
      )}
    </div>
  )
}

export default PostPage