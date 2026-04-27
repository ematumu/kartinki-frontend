import { useState } from 'react'
import { API, API_BASE, apiFetch } from '../config'
import heartOutline from '../assets/icons/heart-outline.svg'
import heartFilled from '../assets/icons/heart-filled.svg'
import commentIcon from '../assets/icons/comment.svg'

function PostCard({ post, onClick, onViewProfile, currentUser }) {
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [liking, setLiking] = useState(false)

  const handleLike = async (e) => {
    e.stopPropagation()
    
    if (!currentUser) {
      alert('Войдите, чтобы ставить лайк')
      return
    }

    setLiking(true)
    try {
      if (isLiked) {
        await apiFetch(API.posts.like(post.id), { method: 'DELETE' })
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        await apiFetch(API.posts.like(post.id), { method: 'POST' })
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (err) {
      console.error('Error liking post:', err)
    } finally {
      setLiking(false)
    }
  }

  const imageUrl = post.image_path ? `${API_BASE}/uploads/${post.image_path}` : null

  return (
    <div className="post-card" onClick={onClick}>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={post.description} 
          className="post-card-image"
          style={{ filter: !currentUser ? 'blur(12px)' : 'none' }}
        />
      ) : (
        <div className="post-card-placeholder">{post.description}</div>
      )}

      <div className="post-card-overlay">
        <button 
          className={`post-card-like-btn ${isLiked ? 'liked' : ''}`}
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
          className="post-card-comment-btn"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <img src={commentIcon} alt="Comment" />
          <span>{post.comments_count || 0}</span>
        </button>
      </div>
    </div>
  )
}

export default PostCard