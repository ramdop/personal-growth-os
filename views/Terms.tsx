import React from 'react';
import { Background } from '../components/Background';

export const Terms: React.FC = () => {
  return (
    <>
      <Background theme="dark" />
      <div className="min-h-screen flex items-center justify-center p-6 text-white/80 relative z-10">
        <div className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl">
          <h1 className="text-3xl font-light text-white mb-6">Terms of Service</h1>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p>
              By accessing <strong>Personal Growth OS ("Signal")</strong>, you verify that you are authorized to use this application 
              for personal productivity and reflection purposes.
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">1. Use of Service</h2>
            <p>
              Signal is a tool for self-reflection and management. It provides no medical, psychological, or financial advice. 
              The AI companion is a language model, not a human professional.
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">2. Liability</h2>
            <p>
              The service is provided "as is" without warranties of any kind. We are not liable for any data loss or 
              decisions made based on the system's output.
            </p>
             <h2 className="text-lg font-medium text-white mt-6 mb-2">3. Google API Services</h2>
            <p>
              Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="underline text-blue-400">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <h2 className="text-lg font-medium text-white mt-6 mb-2">4. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.
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
