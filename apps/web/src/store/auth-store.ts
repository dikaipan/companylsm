import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,
            login: (token: string, user: User) => {
                set({ token, user, isAuthenticated: true });
                // Set default header for future requests
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },
            logout: () => {
                set({ token: null, user: null, isAuthenticated: false });
                delete axios.defaults.headers.common['Authorization'];
            },
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state: AuthState | undefined) => {
                // Restore axios header when auth state is rehydrated from localStorage
                if (state?.token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
                state?.setHasHydrated(true);
            },
        }
    ) as any
);
