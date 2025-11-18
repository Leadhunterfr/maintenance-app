// Client API pour communiquer avec le backend RPI via proxy Vercel
// En dev: accès direct au RPI via Tailscale
// En prod: via proxy Vercel pour éviter les restrictions Private Network Access
const API_URL = import.meta.env.DEV
  ? 'https://rpi011.taild92b43.ts.net/api'  // Dev: direct au RPI
  : '/api';  // Prod: via proxy Vercel

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur serveur');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  // ==================== AUTHENTIFICATION ====================

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async registerSuperAdmin(email, password, name) {
    return await this.request('/auth/register-super-admin', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // ==================== ÉTABLISSEMENTS ====================

  async getEtablissements() {
    return await this.request('/etablissements');
  }

  async getEtablissement(id) {
    return await this.request(`/etablissements/${id}`);
  }

  async createEtablissement(data) {
    return await this.request('/etablissements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEtablissement(id, data) {
    return await this.request(`/etablissements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEtablissement(id) {
    return await this.request(`/etablissements/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FICHES DE MAINTENANCE ====================

  async getFiches(etablissementId) {
    return await this.request(`/etablissements/${etablissementId}/fiches`);
  }

  async getFiche(id) {
    return await this.request(`/fiches/${id}`);
  }

  async createFiche(data) {
    return await this.request('/fiches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFiche(id, data) {
    return await this.request(`/fiches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFiche(id) {
    return await this.request(`/fiches/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== CONTACTS ====================

  async getContacts(etablissementId) {
    return await this.request(`/etablissements/${etablissementId}/contacts`);
  }

  async createContact(data) {
    return await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id, data) {
    return await this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id) {
    return await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export une instance unique
const apiClient = new ApiClient();
export default apiClient;
