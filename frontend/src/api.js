const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mern-otp-creative-recn.vercel.app/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',  // Include credentials for CORS
      mode: 'cors',           // Explicitly set CORS mode
      ...options,
    };

    console.log('🔧 API Request:', { url, method: config.method, body: config.body });

    try {
      console.log('🚀 Making request to:', url);
      const response = await fetch(url, config);
      console.log('🔧 API Response Status:', response.status);
      console.log('🔧 API Response Headers:', response.headers);
      
      // Parse response body only once
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch {
          data = { message: textData || 'Unknown error' };
        }
      }
      
      console.log('🔧 API Response Data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Request failed`);
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