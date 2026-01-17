import React from 'react';
import { Background } from '../components/Background';
import { ArrowRight, Fingerprint, Compass, Lock } from 'lucide-react';

interface LandingProps {
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  return (
    <>
      <Background theme="dark" />
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 text-center">
        
        {/* Hero */}
        <div className="max-w-3xl w-full space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Operational</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white mb-6">
              Personal Growth OS
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              A minimal operating system for your life. Filter the noise, clarify intent, and build identity through consistent action.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <button 
              onClick={onLogin}
              className="px-8 py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5"
            >
              Enter System <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
           <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md group hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Fingerprint className="w-6 h-6 text-white/90" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Habits as Votes</h3>
              <p className="text-sm text-white/70">Track behavior as votes for your desired identity, not just chores to complete.</p>
           </div>
           <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md group hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 text-white/90" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Objectives & Key Results</h3>
              <p className="text-sm text-white/70">Define clear outcomes and measure progress with precision.</p>
           </div>
           <div className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md group hover:bg-white/15 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6 text-white/90" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Private & Secure</h3>
              <p className="text-sm text-white/70">Your data is yours. Secure authentication and local-first philosophy.</p>
           </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full text-center">
          <div className="flex justify-center gap-6 text-xs text-white/80 font-medium">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <p className="text-[10px] text-white/20 mt-2">© {new Date().getFullYear()} Personal Growth OS</p>
        </div>

      </div>
    </>
  );
};
