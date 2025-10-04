// SQLite API client - provides Supabase-like interface
const API_URL = 'http://localhost:3001/api';

let authToken: string | null = null;

// Helper to get auth headers
function getHeaders() {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

// Auth APIs
export const auth = {
  signUp: async ({ email, password }: { email: string; password: string }, fullName: string, role: string, age?: string, gender?: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName, role, age, gender }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signup failed');

    // Store the auth token (now returned by signup endpoint)
    if (data.session?.token) {
      authToken = data.session.token;
      localStorage.setItem('auth_token', authToken);
    }

    return { data, error: null };
  },

  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signin failed');

    // Store the auth token
    authToken = data.session.token;
    localStorage.setItem('auth_token', authToken);

    return { data, error: null };
  },

  signOut: async () => {
    if (!authToken) return { error: null };

    await fetch(`${API_URL}/auth/signout`, {
      method: 'POST',
      headers: getHeaders(),
    });

    authToken = null;
    localStorage.removeItem('auth_token');

    return { error: null };
  },

  getSession: async () => {
    authToken = localStorage.getItem('auth_token');

    if (!authToken) {
      return { data: { session: null }, error: null };
    }

    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        authToken = null;
        localStorage.removeItem('auth_token');
        return { data: { session: null }, error: null };
      }

      const data = await response.json();
      return { data: { session: { user: data.user } }, error: null };
    } catch (error) {
      return { data: { session: null }, error: null };
    }
  },

  onAuthStateChange: (_callback: any) => {
    // Simplified version - just return empty subscription
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

// Database query builder
class QueryBuilder {
  private tableName: string;
  private selectColumns: string = '*';
  private whereConditions: Array<{ field: string; value: any }> = [];
  private orderByField?: { field: string; ascending: boolean };
  private limitValue?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, value });
    return this;
  }

  order(field: string, options: { ascending: boolean }) {
    this.orderByField = { field, ascending: options.ascending };
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  async single() {
    const result = await this.execute();
    return { data: result[0] || null, error: null };
  }

  async maybeSingle() {
    const result = await this.execute();
    return { data: result[0] || null, error: null };
  }

  async then(resolve: any) {
    const result = await this.execute();
    resolve({ data: result, error: null });
  }

  private async execute() {
    let url = `${API_URL}/${this.tableName.replace('_', '-')}`;

    // Build query string
    const params = new URLSearchParams();
    this.whereConditions.forEach(({ field, value }) => {
      params.append(field, value);
    });

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Query failed');

    let data = await response.json();

    // Apply client-side filtering if needed
    if (this.whereConditions.length > 0) {
      data = Array.isArray(data) ? data.filter((item: any) =>
        this.whereConditions.every(({ field, value }) => item[field] === value)
      ) : data;
    }

    // Apply ordering
    if (this.orderByField && Array.isArray(data)) {
      data.sort((a: any, b: any) => {
        const aVal = a[this.orderByField!.field];
        const bVal = b[this.orderByField!.field];
        const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderByField!.ascending ? result : -result;
      });
    }

    // Apply limit
    if (this.limitValue && Array.isArray(data)) {
      data = data.slice(0, this.limitValue);
    }

    return data;
  }
}

export const sqliteClient = {
  auth,

  from: (tableName: string) => ({
    select: (columns?: string) => new QueryBuilder(tableName).select(columns || '*'),

    insert: async (records: any[]) => {
      // Implement insert via API
      return { data: null, error: null };
    },

    update: async (updates: any) => ({
      eq: async (field: string, value: any) => {
        const url = `${API_URL}/${tableName.replace('_', '-')}/${value}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error('Update failed');
        const data = await response.json();

        return {
          select: () => ({
            single: async () => ({ data, error: null }),
          }),
        };
      },
    }),

    delete: () => ({
      eq: async (field: string, value: any) => {
        // Implement delete via API
        return { data: null, error: null };
      },
    }),
  }),
};

// Initialize auth token from localStorage
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('auth_token');
}
