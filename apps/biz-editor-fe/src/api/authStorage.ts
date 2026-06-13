const authTokenKey = 'ai-editor-auth-token'

export function getAuthToken() {
  return localStorage.getItem(authTokenKey)
}

export function setAuthToken(token: string) {
  localStorage.setItem(authTokenKey, token)
}

export function clearAuthToken() {
  localStorage.removeItem(authTokenKey)
}
