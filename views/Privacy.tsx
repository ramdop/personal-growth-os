import React from 'react';
import { Background } from '../components/Background';

export const Privacy: React.FC = () => {
  return (
    <>
      <Background theme="dark" />
      <div className="min-h-screen flex items-center justify-center p-6 text-white/80 relative z-10">
        <div className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-light text-white mb-6">Privacy Policy</h1>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p>
              Your privacy is critical to us. <strong>Personal Growth OS ("Signal")</strong> is designed as a personal utility, 
              not a data-mining operation.
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">1. Data Collection</h2>
            <p>
              We collect only the data necessary for the application's core functionality:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Authentication data (via Google Secure Sign-in).</li>
                <li>User-generated content (Habits, Logs, Objectives) stored securely in our database.</li>
              </ul>
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">2. Google User Data</h2>
            <p>
              If you connect Google Calendar:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>We access your calendar <strong>only</strong> to create events explicitly requested by you.</li>
                <li>We do not read, store, or analyze your existing calendar history.</li>
                <li>We do not share your Google data with any third parties or AI models for training purposes.</li>
              </ul>
            </p>
             <h2 className="text-lg font-medium text-white mt-6 mb-2">3. Data Storage</h2>
            <p>
              Your data is stored in a secure Supabase database. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">4. Your Rights</h2>
            <p>
              You have the right to request the deletion of your account and all associated data at any time.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <a href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">Return to App</a>
          </div>
        </div>
      </div>
    </>
  );
};
