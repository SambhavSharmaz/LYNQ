import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export const ai = {
  smartReplies: async (messages) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/ai/smart-replies`, { messages }, {
        timeout: 3000 // 3 second timeout
      })
      return data.suggestions || []
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log('Smart replies backend not available')
        return [] // Return empty suggestions when backend is down
      }
      throw error
    }
  },
  summarize: async (messages) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/ai/summarize`, { messages }, {
        timeout: 5000
      })
      return data.summary || ''
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log('Summarize backend not available')
        return ''
      }
      throw error
    }
  },
  moderate: async (text) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/ai/moderate`, { text }, {
        timeout: 3000
      })
      return data
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
        console.log('Moderation backend not available')
        return { flagged: false } // Safe default
      }
      throw error
    }
  }
}
