import { useState } from 'react'
import { API, API_BASE, apiFetch, loginFetch } from '../config'

function AuthModal({ mode, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(mode)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    password: '',
    password2: ''
  })
  
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({
    username: '',
    nickname: '',
    password: '',
    password2: ''
  })

  const switchToLogin = () => {
    if (registerData.username) {
      setLoginData(prev => ({
        ...prev,
        username: registerData.username
      }))
    }
    setActiveTab('login')
    setError('')
    setFieldErrors({ username: '', password: '', password2: '' })
  }

  const switchToRegister = () => {
    setActiveTab('register')
    setError('')
    setFieldErrors({ username: '', password: '', password2: '' })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const tokens = await loginFetch(API.login, {
        username: loginData.username,
        password: loginData.password
      })
      
      try {
        const fullProfile = await apiFetch(API.users.me, {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        })
        const userData = { ...tokens, ...fullProfile }
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
        onClose()
      } catch (profileErr) {
        console.error('Failed to load profile:', profileErr)
        const userData = { ...tokens, username: loginData.username }
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    setError('')
    const newFieldErrors = { username: '', password: '', password2: '' }
    let hasError = false

    if (!registerData.username) {
      newFieldErrors.username = 'Введите имя пользователя'
      hasError = true
    } else if (registerData.username.length < 3) {
      newFieldErrors.username = 'Имя пользователя должно быть не менее 3 символов'
      hasError = true
    } else if (!registerData.username.replace(/_/g, '').match(/^[a-zA-Z0-9]+$/)) {
      newFieldErrors.username = 'Имя пользователя может содержать только буквы, цифры и _'
      hasError = true
    }

    if (!registerData.password) {
      newFieldErrors.password = 'Введите пароль'
      hasError = true
    } else if (registerData.password.length < 6) {
      newFieldErrors.password = 'Пароль должен быть не менее 6 символов'
      hasError = true
    }

    if (!registerData.password2) {
      newFieldErrors.password2 = 'Подтвердите пароль'
      hasError = true
    } else if (registerData.password !== registerData.password2) {
      newFieldErrors.password2 = 'Пароли не совпадают'
      hasError = true
    }

    if (hasError) {
      setFieldErrors(newFieldErrors)
      return
    }

    setLoading(true)

    try {
      await apiFetch(API.register, {
        method: 'POST',
        body: JSON.stringify({
          username: registerData.username,
          nickname: registerData.nickname || '',
          password: registerData.password,
          password2: registerData.password2
        })
      })
      
      const tokens = await loginFetch(API.login, {
        username: registerData.username,
        password: registerData.password
      })
      
      try {
        const fullProfile = await apiFetch(API.users.me, {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        })
        const userData = { ...tokens, ...fullProfile }
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
        onClose()
      } catch (profileErr) {
        console.error('Failed to load profile after register:', profileErr)
        switchToLogin()
        setRegisterData({ username: '', nickname: '', password: '', password2: '' })
      }
      
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setRegisterData({...registerData, [field]: value})
    if (fieldErrors[field]) {
      setFieldErrors({...fieldErrors, [field]: ''})
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="auth-tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={switchToLogin}
          >
            Войти
          </button>
          <button 
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={switchToRegister}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <input 
              type="text" 
              placeholder="Имя пользователя" 
              className="auth-input" 
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              required 
              disabled={loading}
            />
            <input 
              type="password" 
              placeholder="Пароль" 
              className="auth-input" 
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required 
              disabled={loading}
            />
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <input 
              type="text" 
              placeholder="Имя пользователя" 
              className={`auth-input ${fieldErrors.username ? 'error' : ''}`}
              value={registerData.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              disabled={loading}
            />
            {fieldErrors.username && (
              <div className="field-error">{fieldErrors.username}</div>
            )}
            
            <input 
              type="text" 
              placeholder="Никнейм (отображаемое имя)" 
              className="auth-input" 
              value={registerData.nickname}
              onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})}
              disabled={loading}
            />
            
            <input 
              type="password" 
              placeholder="Пароль (мин. 6 символов)" 
              className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
              value={registerData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              disabled={loading}
            />
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
            
            <input 
              type="password" 
              placeholder="Подтвердите пароль" 
              className={`auth-input ${fieldErrors.password2 ? 'error' : ''}`}
              value={registerData.password2}
              onChange={(e) => handleFieldChange('password2', e.target.value)}
              disabled={loading}
            />
            {fieldErrors.password2 && (
              <div className="field-error">{fieldErrors.password2}</div>
            )}
            
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthModal