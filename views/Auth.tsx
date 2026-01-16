
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { AuthService } from '../services/auth';
import { User } from '../types';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  theme: 'light' | 'dark';
}

export const Auth: React.FC<AuthProps> = ({ onLogin, theme }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegistering) {
        if (!name) { setError("Name is required."); setLoading(false); return; }
        result = await AuthService.register(email, password, name);
      } else {
        result = await AuthService.login(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        onLogin(result.user);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await AuthService.loginWithGoogle();
      if (result.user) {
        onLogin(result.user);
      } else {
        setError("Google authentication failed.");
      }
    } catch (err) {
      setError("Connection to provider failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full py-12 px-8 relative overflow-hidden">
        
        {/* Decorative background glow inside card */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${isRegistering ? 'from-emerald-500 to-teal-500' : 'from-primary/20 to-primary/40'}`} />

        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full bg-primary/5 border border-primary/10 transition-all duration-500 ${isRegistering ? 'rotate-180' : ''}`}>
             <Shield className="w-12 h-12 text-primary/80" />
          </div>
        </div>
        
        <h1 className="text-3xl font-serif text-center mb-2 text-primary">Personal Growth OS</h1>
        <p className="text-muted text-center mb-8 italic text-sm">
          {isRegistering ? "Commit to the journey of compounding reflection." : "\"Reflection creates signal. Visualization is earned.\""}
        </p>

        {/* SSO Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading || isGoogleLoading}
          className="w-full bg-white text-gray-800 hover:bg-gray-50 py-3 rounded-lg font-medium flex items-center justify-center gap-3 transition-all mb-6 shadow-sm disabled:opacity-70"
        >
          {isGoogleLoading ? (
             <Loader2 className="animate-spin text-gray-600" size={20} />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="relative flex items-center justify-center mb-6">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-primary/10"></div>
           </div>
           <span className="relative bg-glass-surface px-4 text-xs text-muted uppercase tracking-wider backdrop-blur-xl rounded">Or with email</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted ml-1">Name</label>
              <input 
                type="text" 
                placeholder="What should we call you?" 
                className="w-full bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-primary placeholder-primary/30 focus:outline-none focus:border-primary/30 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted ml-1">Email</label>
            <input 
              type="email" 
              placeholder="seeker@example.com" 
              className="w-full bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-primary placeholder-primary/30 focus:outline-none focus:border-primary/30 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-primary/5 border border-primary/10 rounded-lg px-4 py-3 text-primary placeholder-primary/30 focus:outline-none focus:border-primary/30 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>}

          <button 
            type="submit"
            disabled={loading || isGoogleLoading}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-6 shadow-lg 
              ${isRegistering 
                ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-primary text-glass-surface hover:opacity-90 shadow-primary/10'
              }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isRegistering ? 'Initialize System' : 'Enter System'}
                {!loading && <ArrowRight size={18} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 mx-auto"
          >
            {isRegistering ? (
              <>Already have an account? <span className="underline decoration-primary/30">Log in</span></>
            ) : (
              <>New to the system? <span className="underline decoration-primary/30">Create identity</span></>
            )}
          </button>
        </div>
      </GlassCard>
      
      <div className="absolute bottom-4 text-center text-xs text-primary/20">
        Secure Local-First Encryption • v1.3
      </div>
    </div>
  );
};
