import axios, { AxiosInstance } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', { username, password })
    return response.data
  }

  // Users endpoints
  async getUsers(includeInactive = false) {
    const response = await this.client.get(`/users?includeInactive=${includeInactive}`)
    const responseData = response.data?.data
    return {
      ...response.data,
      data: this.toCamelCase(Array.isArray(responseData) ? responseData : [])
    }
  }

  async getUserTree() {
    const response = await this.client.get('/users/tree')
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async getUser(id: number) {
    const response = await this.client.get(`/users/${id}`)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async createUser(userData: any) {
    const response = await this.client.post('/users', userData)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async updateUser(id: number, userData: any) {
    const response = await this.client.put(`/users/${id}`, userData)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async deleteUser(id: number) {
    const response = await this.client.delete(`/users/${id}`)
    return response.data
  }

  async toggleUserStatus(id: number, activate: boolean) {
    const endpoint = activate ? 'activate' : 'deactivate'
    const response = await this.client.put(`/users/${id}/${endpoint}`)
    return response.data
  }

  // Helper function to convert snake_case to camelCase
  private toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item))
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((result: any, key: string) => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        result[camelKey] = this.toCamelCase(obj[key])
        return result
      }, {})
    }
    return obj
  }

  // Highways endpoints
  async getHighways(filters?: any) {
    const params = new URLSearchParams(filters).toString()
    const response = await this.client.get(`/highways?${params}`)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async getHighwaysGeoJSON(filters?: any) {
    const params = new URLSearchParams(filters).toString()
    const response = await this.client.get(`/highways/geojson?${params}`)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async getHighway(id: number) {
    const response = await this.client.get(`/highways/${id}`)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async getHighwayWithSections(id: number) {
    const response = await this.client.get(`/highways/${id}/sections`)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async createHighway(highwayData: any) {
    const response = await this.client.post('/highways', highwayData)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async updateHighway(id: number, highwayData: any) {
    const response = await this.client.put(`/highways/${id}`, highwayData)
    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }

  async deleteHighway(id: number) {
    const response = await this.client.delete(`/highways/${id}`)
    return response.data
  }

  async getNearbyHighways(id: number, distance: number = 10) {
    const response = await this.client.get(`/highways/nearby/${id}?distance=${distance}`)
    return response.data
  }

  async bulkUploadHighways(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post('/highways/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      ...response.data,
      data: this.toCamelCase(response.data.data)
    }
  }
}

export const apiClient = new ApiClient()
