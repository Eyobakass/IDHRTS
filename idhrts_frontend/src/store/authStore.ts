import { create } from 'zustand';

interface AuthState {
    token: string | null;
    role: string | null;
    setAuth: (token: string, role: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
    role: typeof window !== 'undefined' ? localStorage.getItem('user_role') : null,
    setAuth: (token, role) => {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user_role', role);
        set({ token, role });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        set({ token: null, role: null });
    }
}));
