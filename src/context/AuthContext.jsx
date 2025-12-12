import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginType, setLoginType] = useState(localStorage.getItem('loginType') || null); // 'admin' or 'voter'
    const { showToast } = useToast();

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                // Clear type if logged out
                setLoginType(null);
                localStorage.removeItem('loginType');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password, type = 'voter') => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // Set Login Type
            setLoginType(type);
            localStorage.setItem('loginType', type);

            showToast("Login Successful!", "success");
            return data;
        } catch (error) {
            showToast(error.message, "error");
            throw error;
        }
    };

    const signup = async (email, password, type = 'voter') => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;

            // Set Login Type (usually signups are voters)
            setLoginType(type);
            localStorage.setItem('loginType', type);

            showToast("Account created! You can now log in.", "success");
            return data;
        } catch (error) {
            showToast(error.message, "error");
            throw error;
        }
    };

    const logout = async () => {
        // ALWAYS clear local state first to ensure UI updates immediately
        setUser(null);
        setLoginType(null);
        localStorage.removeItem('loginType');

        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                // If 403 or "session missing", it means we are already logged out on server
                if (error.status === 403 || error.message.includes('missing')) {
                    // Ignore specific "already logged out" errors
                    console.log("Session already expired on server.");
                } else {
                    throw error;
                }
            }
            showToast("Logged out successfully", "info");
        } catch (error) {
            console.error("Logout error:", error);
            // Even if it fails, we already cleared the UI state
            showToast("Logged out (Session Expired)", "info");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginType, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
