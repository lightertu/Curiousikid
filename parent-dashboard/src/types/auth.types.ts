export interface User {
  id: string;
  email: string;
  childProfiles: ChildProfile[];
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  deviceId: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
