import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch } from '../config'

function CommentItem({ 
  comment, 
  currentUser, 
  replies, 
  expandedComments, 
  replyTexts,
  replyingTo,
  editingId,
  onToggleReplies, 
  onLoadReplies,
  onReply, 
  onDelete, 
  onReplyTextChange,
  onNavigateToProfile,
  onEditSave,
  onCancelEdit,
  onStartEdit,
  depth = 0 
}) {
  const hasReplies = comment.replies_count > 0
  const isExpanded = expandedComments[comment.id]
  const currentReplies = replies[comment.id] || []
  const replyText = replyTexts[comment.id] || ''
  const isReplying = replyingTo === comment.id
  const isEditing = editingId === comment.id
  
  const [editText, setEditText] = useState(comment.text)

  return (
    <div className={`comment-item ${depth > 0 ? 'reply-item' : ''}`} style={{ marginLeft: depth > 0 ? '30px' : '0' }}>
      <div className="comment-avatar" onClick={() => onNavigateToProfile(comment.username)} style={{ cursor: 'pointer' }}>
        {comment.user_avatar_url ? (
          <img src={`${API_BASE}${comment.user_avatar_url}`} alt={comment.username} />
        ) : (
          <span>{comment.username?.[0]?.toUpperCase()}</span>
        )}
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author" onClick={() => onNavigateToProfile(comment.username)} style={{ cursor: 'pointer' }}>
            {comment.user_nickname || comment.username}
          </span>
          <span className="comment-date">
            {new Date(comment.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
        
        {!isEditing ? (
          <p className="comment-text">{comment.text}</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onEditSave(comment.id, editText); }} className="edit-form">
            <textarea
              className="comment-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="edit-buttons">
              <button type="submit" className="btn btn-primary btn-small" disabled={editText.trim() === comment.text}>
                Сохранить
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={onCancelEdit}>
                Отмена
              </button>
            </div>
          </form>
        )}
        
        <div className="comment-actions">
          {!isEditing && currentUser && (
            <button className="comment-reply-btn" onClick={() => onReply(comment.id)}>
              Ответить
            </button>
          )}

          {!isEditing && currentUser && comment.is_owner && (
            <button 
              className="comment-reply-btn" 
              style={{ color: '#4A5D3F' }} 
              onClick={() => onStartEdit(comment.id)}
            >
              Редактировать
            </button>
          )}
          
          {!isEditing && currentUser && comment.is_owner && (
            <button className="comment-delete" onClick={() => onDelete(comment.id)}>
              Удалить
            </button>
          )}

          {hasReplies && (
            <button className="comment-replies-toggle" onClick={() => onToggleReplies(comment.id)}>
              {isExpanded ? 'Скрыть ' : 'Показать '} ответы ({comment.replies_count})
            </button>
          )}
        </div>

        {!isEditing && currentUser && isReplying && (
          <form onSubmit={(e) => { e.preventDefault(); if (replyText.trim()) onReply(comment.id, replyText); }} className="reply-form">
            <textarea
              className="comment-input"
              placeholder={`Ответить @${comment.username}...`}
              value={replyText}
              onChange={(e) => onReplyTextChange(comment.id, e.target.value)}
              rows={2}
            />
            <div className="reply-buttons">
              <button type="submit" className="btn btn-primary btn-small">Отправить</button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => onReply(comment.id, null)}>Отмена</button>
            </div>
          </form>
        )}
      </div>
      
      {isExpanded && hasReplies && currentReplies.length > 0 && (
        <div className="replies-list" style={{ marginTop: '15px' }}>
          {currentReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              replies={replies}
              expandedComments={expandedComments}
              replyTexts={replyTexts}
              replyingTo={replyingTo}
              editingId={editingId}
              onToggleReplies={onToggleReplies}
              onLoadReplies={onLoadReplies}
              onReply={onReply}
              onDelete={onDelete}
              onReplyTextChange={onReplyTextChange}
              onNavigateToProfile={onNavigateToProfile}
              onEditSave={onEditSave}
              onCancelEdit={onCancelEdit}
              onStartEdit={onStartEdit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentsPanel({ postId, currentUser, onClose }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replies, setReplies] = useState({})
  const [expandedComments, setExpandedComments] = useState({})
  const [replyTexts, setReplyTexts] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingId, setEditingId] = useState(null)
  
  useEffect(() => { loadComments() }, [postId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await apiFetch(API.comments.list(postId))
      setComments(data || [])
    } catch (err) {
      console.error('Ошибка:', err)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const loadReplies = async (commentId) => {
    if (replies[commentId]) return
    try {
      const data = await apiFetch(API.comments.replies(commentId))
      setReplies(prev => ({ ...prev, [commentId]: data || [] }))
    } catch (err) { console.error(err) }
  }

  const toggleReplies = async (commentId) => {
    if (!expandedComments[commentId]) await loadReplies(commentId)
    setExpandedComments(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const handleStartEdit = (commentId) => {
    setEditingId(commentId);
  }

  const handleEditSave = async (commentId, newText) => {
    if (!newText.trim()) return;
    try {
      await apiFetch(API.comments.update(commentId), {
        method: 'PATCH',
        body: JSON.stringify({ text: newText.trim() })
      })
      await loadComments();
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null);
  }

  const handleReply = async (commentId, text) => {
    if (text === null) { setReplyingTo(null); setReplyTexts(p => ({...p, [commentId]: ''})); return; }
    if (text !== undefined) {
      if (!text.trim()) return;
      setSubmitting(true);
      try {
        await apiFetch(API.comments.create, { method: 'POST', body: JSON.stringify({ text: text.trim(), post_id: postId, parent_id: commentId }) });
        const freshReplies = await apiFetch(API.comments.replies(commentId));
        setReplies(prev => ({ ...prev, [commentId]: freshReplies || [] }));
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies_count: (c.replies_count || 0) + 1 } : c));
        setExpandedComments(prev => ({ ...prev, [commentId]: true }));
        setReplyingTo(null); setReplyTexts(p => ({...p, [commentId]: ''}));
      } catch (err) { alert(err.message) } finally { setSubmitting(false) }
    } else {
      setReplyingTo(commentId);
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(API.comments.create, { method: 'POST', body: JSON.stringify({ text: newComment.trim(), post_id: postId, parent_id: 0 }) });
      setNewComment(''); await loadComments();
    } catch (err) { alert(err.message) } finally { setSubmitting(false) }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await apiFetch(API.comments.delete(commentId), { method: 'DELETE' });
      setComments(prev => (prev || []).filter(c => c.id !== commentId));
    } catch (err) { 
      alert(err.message) 
    }
  }

  const handleReplyTextChange = (commentId, text) => setReplyTexts(prev => ({ ...prev, [commentId]: text }));
  const handleNavigateToProfile = (username) => { onClose(); window.dispatchEvent(new CustomEvent('navigateToProfile', { detail: { username } })); }

  return (
    <div className="comments-panel-overlay" onClick={onClose}>
      <div className="comments-panel" onClick={(e) => e.stopPropagation()}>
        <div className="comments-panel-header">
          <h2>Комментарии</h2>
          <button className="comments-panel-close" onClick={onClose}>×</button>
        </div>
        
        {currentUser ? (
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea className="comment-input" placeholder="Напишите комментарий..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} disabled={submitting} />
            <button type="submit" className="btn btn-primary btn-small" disabled={submitting || !newComment.trim()}>{submitting ? 'Отправка...' : 'Отправить'}</button>
          </form>
        ) : (
          <div className="comment-login-prompt"><p>Войдите, чтобы комментировать</p></div>
        )}
        
        <div className="comments-panel-list">
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : !comments || comments.length === 0 ? (
            <div className="empty-feed"><p>Пока нет комментариев</p></div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  replies={replies}
                  expandedComments={expandedComments}
                  replyTexts={replyTexts}
                  replyingTo={replyingTo}
                  editingId={editingId}
                  onToggleReplies={toggleReplies}
                  onLoadReplies={loadReplies}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  onReplyTextChange={handleReplyTextChange}
                  onNavigateToProfile={handleNavigateToProfile}
                  onEditSave={handleEditSave}
                  onCancelEdit={handleCancelEdit}
                  onStartEdit={handleStartEdit}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentsPanel