import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        try {
            await api.post('/auth/login', { email, password });
            await checkAuth();
            navigate('/');
            toast({
                title: 'Success',
                description: 'Logged in successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Invalid credentials',
                variant: 'destructive',
            });
            throw error;
        }
    }

    async function register(email: string, password: string) {
        try {
            await api.post('/auth/register', { email, password });
            await login(email, password);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to register',
                variant: 'destructive',
            });
            throw error;
        }
    }

    async function logout() {
        try {
            await api.post('/auth/logout');
            setUser(null);
            navigate('/login');
            toast({
                title: 'Success',
                description: 'Logged out successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to logout',
                variant: 'destructive',
            });
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 