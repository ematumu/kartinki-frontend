import { API_BASE } from '../config'

function PostCard({ post, onClick, currentUser }) {
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
        <div className="post-card-placeholder">
          {post.description}
        </div>
      )}
    </div>
  )
}

export default PostCard