export const API_BASE_URL = "https://s4-dbms-micro-project.onrender.com/api"

export async function fetchWithAuth(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || "An error occurred")
  }

  return response.json()
}

