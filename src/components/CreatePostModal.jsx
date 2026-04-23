import { useState } from 'react'
import { API, uploadFile } from '../config'

function CreatePostModal({ onClose, onSuccess, token }) {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('description', description)
      
      if (image) {
        formData.append('file', image)
      }

      await uploadFile(API.posts.create, formData)
      onSuccess()
    } catch (err) {
      setError(err.message || 'Ошибка создания поста')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-post-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Создание поста</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="create-post-form">
          <div className={`upload-area ${preview ? 'has-image' : ''}`} onClick={() => document.getElementById('image-input').click()}>
            {preview ? (
              <img src={preview} alt="Preview" />
            ) : (
              <div>
                <p>Нажмите для загрузки изображения</p>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  или перетащите файл сюда
                </p>
              </div>
            )}
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="form-group">
            <textarea
              className="form-textarea"
              placeholder="Описание поста..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePostModal