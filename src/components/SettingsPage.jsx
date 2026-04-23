import { useState, useEffect } from 'react'
import { API, API_BASE, apiFetch } from '../config'

function SettingsPage({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (user?.is_private !== undefined) {
      setIsPrivate(user.is_private)
    }
  }, [user])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    
    if (passwordData.new_password.length < 4) {
      setPasswordError('Новый пароль должен быть не менее 6 символов')
      return
    }
    
    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordError('Новые пароли не совпадают')
      return
    }
    
    setLoading(true)
    
    try {
      await apiFetch(API.users.changePassword, {
        method: 'POST',
        body: JSON.stringify(passwordData)
      })
      
      setPasswordSuccess('Пароль успешно изменён')
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: ''
      })
      
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err.message || 'Ошибка при смене пароля')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'УДАЛИТЬ') {
      setDeleteError('Введите "УДАЛИТЬ" для подтверждения')
      return
    }

    setDeleteLoading(true)
    setDeleteError('')

    try {
      await apiFetch('/api/users/me', {
        method: 'DELETE',
      })

      onLogout()
      window.location.href = '/'
      
    } catch (err) {
      setDeleteError(err.message || 'Ошибка при удалении аккаунта')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleTogglePrivate = async (newValue) => {
    setIsPrivate(newValue)
    setSavingPrivacy(true)
    
    try {
      await apiFetch('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ is_private: newValue })
      })
      if (window.updateGlobalUser) {
        window.updateGlobalUser({ ...user, is_private: newValue })
      }
    } catch (err) {
      setIsPrivate(!newValue)
      alert('Не удалось сохранить настройки: ' + err.message)
    } finally {
      setSavingPrivacy(false)
    }
  }

  return (
    <div className="settings-page">
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Назад
      </button>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('security')
              setDeleteError('')
              setDeleteConfirm('')
            }}
          >
            Безопасность
          </button>
          <button onClick={onLogout} className="settings-tab logout">
            Выйти
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div>
              <h2>Профиль</h2>
              <div className="setting-item">
                <label>Частный профиль</label>
                <input 
                  type="checkbox" 
                  checked={isPrivate}
                  onChange={(e) => handleTogglePrivate(e.target.checked)}
                  disabled={savingPrivacy}
                />
              </div>
              <p className="setting-hint">
                Если включено, только подписчики смогут видеть ваши посты
              </p>
              {savingPrivacy && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
                  Сохранение...
                </p>
              )}
            </div>
          )}
          
          {activeTab === 'security' && (
            <div>
              <h2>Безопасность</h2>
              
              <form onSubmit={handleChangePassword} className="auth-form" style={{ maxWidth: '400px', marginBottom: '40px' }}>
                {passwordError && <div className="auth-error">{passwordError}</div>}
                {passwordSuccess && <div className="auth-success" style={{
                  background: '#E8F5E9',
                  color: '#2E7D32',
                  padding: '12px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #C8E6C9'
                }}>{passwordSuccess}</div>}
                
                <input 
                  type="password" 
                  placeholder="Текущий пароль" 
                  className="auth-input" 
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                  required
                  disabled={loading}
                />
                
                <input 
                  type="password" 
                  placeholder="Новый пароль" 
                  className="auth-input" 
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  required
                  disabled={loading}
                  minLength={6}
                />
                
                <input 
                  type="password" 
                  placeholder="Подтвердите новый пароль" 
                  className="auth-input" 
                  value={passwordData.new_password2}
                  onChange={(e) => setPasswordData({...passwordData, new_password2: e.target.value})}
                  required
                  disabled={loading}
                  minLength={6}
                />
                
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сменить пароль'}
                </button>
              </form>

              <div style={{
                borderTop: '2px solid var(--bg-primary)',
                margin: '40px 0',
                paddingTop: '30px'
              }}>
                <h3 style={{marginBottom: '20px' }}>
                  Удаление аккаунта
                </h3>
                
                <div style={{
                  background: '#FFEBEE',
                  border: '1px solid #FFCDD2',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '25px'
                }}>
                  <p style={{ color: 'var(--text-primary)', marginBottom: '10px', fontWeight: '500' }}>
                    Это действие нельзя отменить
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                    После удаления аккаунта:<br/>
                    • Все ваши посты и комментарии будут удалены<br/>
                    • Подписки и подписчики будут потеряны<br/>
                    • Восстановить данные будет невозможно
                  </p>
                </div>

                {deleteError && (
                  <div className="auth-error" style={{ marginBottom: '15px' }}>
                    {deleteError}
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>
                    Для подтверждения введите: <strong>УДАЛИТЬ</strong>
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="УДАЛИТЬ"
                    value={deleteConfirm}
                    onChange={(e) => {
                      setDeleteConfirm(e.target.value)
                      setDeleteError('')
                    }}
                    disabled={deleteLoading}
                    style={{ 
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderColor: deleteConfirm === 'УДАЛИТЬ' ? 'var(--error)' : 'var(--border-color)'
                    }}
                  />
                </div>

                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirm !== 'УДАЛИТЬ'}
                  className="btn"
                  style={{
                    background: 'var(--error)',
                    color: 'white',
                    padding: '14px 35px',
                    borderRadius: '30px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (deleteLoading || deleteConfirm !== 'УДАЛИТЬ') ? 'not-allowed' : 'pointer',
                    opacity: (deleteLoading || deleteConfirm !== 'УДАЛИТЬ') ? 0.6 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  {deleteLoading ? 'Удаление...' : 'Удалить аккаунт навсегда'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage