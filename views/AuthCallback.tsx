import React, { useEffect } from 'react';

export const AuthCallback: React.FC = () => {
  useEffect(() => {
    // 1. Get the tokens from the URL hash
    const hash = window.location.hash;
    
    if (!hash) return; // No tokens, do nothing

    // 2. Construct the Deep Link URL
    // We pass the exact same hash fragment to the app
    const deepLink = `pgos://login-callback${hash}`;

    console.log('Bouncing to app:', deepLink);

    // 3. Force the browser to open the app
    // A slight delay ensures the browser has parsed the page before redirecting
    setTimeout(() => {
        window.location.href = deepLink;
    }, 100);

  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <h1 className="text-xl font-bold">Opening Personal Growth OS...</h1>
      <p className="text-white/50 mt-2">If the app doesn't open, <a href={`pgos://login-callback${window.location.hash}`} className="text-primary underline">click here</a>.</p>
    </div>
  );
};
