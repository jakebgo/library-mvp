'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check auth state on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          router.push('/books');
        }
      } catch (err) {
        console.error('Auth check error:', err);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isReset) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage('Check your email for the password reset link');
      } else {
        if (isLogin) {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) throw signInError;
          
          if (data?.user) {
            // Ensure session is properly set
            await supabase.auth.setSession({
              access_token: data.session!.access_token,
              refresh_token: data.session!.refresh_token,
            });
            router.push('/books');
            router.refresh();
          }
        } else {
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
            },
          });

          if (signUpError) throw signUpError;
          setMessage('Please check your email for verification link.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsReset(false);
    setError(null);
    setMessage(null);
  };

  const toggleReset = () => {
    setIsReset(!isReset);
    setIsLogin(true);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isReset ? 'Reset Password' : (isLogin ? 'Login' : 'Sign Up')}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isLoading}
          />
        </div>

        {!isReset && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="text-sm text-green-600">
            {message}
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isLoading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : (isReset ? 'Send Reset Link' : (isLogin ? 'Login' : 'Sign Up'))}
        </button>

        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-indigo-600 hover:text-indigo-500"
            disabled={isLoading}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
          
          {isLogin && !isReset && (
            <button
              type="button"
              onClick={toggleReset}
              className="text-sm text-indigo-600 hover:text-indigo-500"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 