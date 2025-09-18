const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🔧 API Request:', { url, config });

    try {
      const response = await fetch(url, config);
      console.log('🔧 API Response Status:', response.status);
      console.log('🔧 API Response Headers:', response.headers);
      
      const data = await response.json();
      console.log('🔧 API Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      console.error('❌ Error details:', { endpoint, url, error: error.message });
      throw error;
    }
  }

  // Auth endpoints
  signup(email, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  verifyOtp(email, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  resendOtp(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }
}

const api = new ApiClient();
export default api;