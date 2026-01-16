
import React, { useState, useEffect } from 'react';

const LOCAL_BG = "background.png";
// A deep, sunlight-dappled forest landscape (Nature/Sanctuary vibe)
const REMOTE_BG = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop";

export const Background: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  const [activeBg, setActiveBg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRemote = () => {
      const remoteImg = new Image();
      remoteImg.src = REMOTE_BG;
      remoteImg.onload = () => {
        if (isMounted) setActiveBg(REMOTE_BG);
      };
      remoteImg.onerror = () => {
        console.warn("Remote background failed. Falling back to pure CSS.");
      };
    };

    // 1. Try Local First
    const localImg = new Image();
    localImg.src = LOCAL_BG;

    localImg.onload = () => {
      // CRITICAL CHECK: Ensure it's actually an image, not index.html returning 200 OK
      if (localImg.naturalWidth > 0 && localImg.naturalHeight > 0) {
        if (isMounted) setActiveBg(LOCAL_BG);
      } else {
        // False positive (likely HTML), try remote
        loadRemote();
      }
    };

    localImg.onerror = () => {
      // Real error (404), try remote
      loadRemote();
    };

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 -z-50 bg-black overflow-hidden">
      {/* 
         Fallback Gradient (if no image)
      */}
      {!activeBg && (
        <div className={`absolute inset-0 transition-colors duration-1000 ${isLight
            ? 'bg-gradient-to-br from-indigo-50 via-white to-amber-50'
            : 'bg-gradient-to-br from-gray-900 via-black to-slate-900'
          }`} />
      )}

      {/* 
         Static Image
         Removed animations to ensure rendering stability for glass effect.
      */}
      {activeBg && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${activeBg}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1,
          }}
        />
      )}
    </div>
  );
};
