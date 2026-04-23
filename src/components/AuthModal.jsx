import { useState } from 'react'
import { API, API_BASE, apiFetch, loginFetch } from '../config'

function AuthModal({ mode, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(mode)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({
    username: '',
    nickname: '',
    password: '',
    password2: ''
  })

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
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })

        const userData = {
          ...tokens,
          ...fullProfile
        }
        
        console.log('Full user data:', userData)
        
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
        onClose()
      } catch (profileErr) {
        console.error('Failed to load profile:', profileErr)
        const userData = {
          ...tokens,
          username: loginData.username
        }
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

    if (registerData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }
    
    if (registerData.password !== registerData.password2) {
      setError('Пароли не совпадают')
      return
    }

    if (!registerData.username.replace(/_/g, '').match(/^[a-zA-Z0-9]+$/)) {
      setError('Имя пользователя может содержать только буквы, цифры и _')
      return
    }
    
    if (registerData.username.length < 3) {
      setError('Имя пользователя должно быть не менее 3 символов')
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
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        })
        
        const userData = {
          ...tokens,
          ...fullProfile
        }
        
        localStorage.setItem('user', JSON.stringify(userData))
        onAuthSuccess(userData)
        

        onClose()
      } catch (profileErr) {
        console.error('Failed to load profile after register:', profileErr)
        setActiveTab('login')
        setRegisterData({ username: '', nickname: '', password: '', password2: '' })
      }
      
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="auth-tabs">
          <button 
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Войти
          </button>
          <button 
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
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
              minLength={3}
            />
            <input 
              type="password" 
              placeholder="Пароль" 
              className="auth-input" 
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required 
              disabled={loading}
              minLength={4}
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
              className="auth-input" 
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              required 
              disabled={loading}
              minLength={3}
            />
            <input 
              type="text" 
              placeholder="Никнейм" 
              className="auth-input" 
              value={registerData.nickname}
              onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})}
              disabled={loading}
            />
            <input 
              type="password" 
              placeholder="Пароль (мин. 6 символов)" 
              className="auth-input" 
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              required 
              minLength={6}
              disabled={loading}
            />
            <input 
              type="password" 
              placeholder="Подтвердите пароль" 
              className="auth-input" 
              value={registerData.password2}
              onChange={(e) => setRegisterData({...registerData, password2: e.target.value})}
              required 
              disabled={loading}
            />
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Регистрация...' : 'Регистрация'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthModal