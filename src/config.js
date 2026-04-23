export const CONFIG = {
  API_BASE: 'http://nekiy_ip:8000',
  
  API: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    
    posts: {
      list: '/api/posts/feed/latest',
      popular: '/api/posts/feed/popular',
      following: '/api/posts/feed/following',
      create: '/api/posts/',
      byId: (id) => `/api/posts/${id}`,
      delete: (id) => `/api/posts/${id}`,
      userPosts: (username) => `/api/posts/user/${username}`,
      like: (id) => `/api/posts/${id}/like`,
      bookmarks: '/api/posts/bookmarks/',
      bookmark: (id) => `/api/posts/${id}/bookmark`

    },
    comments: {
      list: (postId) => `/api/comments/post/${postId}`,
      replies: (commentId) => `/api/comments/${commentId}/replies`,
      create: '/api/comments/',
      update: (commentId) => `/api/comments/${commentId}`,
      delete: (commentId) => `/api/comments/${commentId}`,
    },
    users: {
      profile: (username) => `/api/users/${username}`,
      me: '/api/users/me',
      update: '/api/users/me',
      changePassword: '/api/users/me/change-password',
      uploadAvatar: '/api/users/me/avatar',
      follow: (username) => `/api/users/${username}/follow`,
      followers: (username) => `/api/users/${username}/followers`,
      following: (username) => `/api/users/${username}/following`,
      search: (query) => `/api/users/search/?q=${encodeURIComponent(query)}`
    },

    tags: {
      search: (query, limit = 10) => `/api/tags/search/?q=${encodeURIComponent(query)}&limit=${limit}`,  // ← ДОБАВЬ
    },
  }
}

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${CONFIG.API_BASE}${endpoint}`
  
  const user = localStorage.getItem('user')
  const token = user ? JSON.parse(user).access_token : null
  
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  try {
    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      const currentUser = localStorage.getItem('user')
      if (currentUser) {
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth:expired'))
      }
      return null
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail)
        } else if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            if (typeof err === 'string') return err
            if (typeof err === 'object' && err.msg) return err.msg
            return JSON.stringify(err)
          })
          throw new Error(messages.join(', '))
        } else {
          throw new Error(JSON.stringify(errorData.detail))
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    }
    
    const text = await response.text()
    return text ? JSON.parse(text) : null
    
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const loginFetch = async (endpoint, credentials) => {
  const url = `${CONFIG.API_BASE}${endpoint}`
  
  const formData = new URLSearchParams()
  formData.append('username', credentials.username)
  formData.append('password', credentials.password)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail)
        } else if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            if (typeof err === 'string') return err
            if (typeof err === 'object' && err.msg) return err.msg
            return JSON.stringify(err)
          })
          throw new Error(messages.join(', '))
        }
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const text = await response.text()
    return text ? JSON.parse(text) : null
    
  } catch (error) {
    console.error('Login Error:', error)
    throw error
  }
}

export const uploadFile = async (endpoint, formData) => {
  const url = `${CONFIG.API_BASE}${endpoint}`
  
  const user = localStorage.getItem('user')
  const token = user ? JSON.parse(user).access_token : null
  
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail)
        } else if (Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            if (typeof err === 'string') return err
            if (typeof err === 'object' && err.msg) return err.msg
            return JSON.stringify(err)
          })
          throw new Error(messages.join(', '))
        }
      }
      throw new Error(`HTTP ${response.status}`)
    }
    
    const text = await response.text()
    return text ? JSON.parse(text) : null
    
  } catch (error) {
    console.error('Upload Error:', error)
    throw error
  }
}

export function getAvatarUrl(user) {
  if (!user) return null
  if (user.avatar_url) {
    if (user.avatar_url.startsWith('http')) return user.avatar_url
    return `${CONFIG.API_BASE}${user.avatar_url}`
  }
  if (user.avatar_path) {
    return `${CONFIG.API_BASE}/uploads/avatars/${user.avatar_path}`
  }
  return null
}

export const { API, API_BASE } = CONFIG
export default CONFIG
