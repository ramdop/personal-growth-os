
import React, { useState, useEffect } from 'react';
import { Background } from './components/Background';
import { loadState, saveState } from './services/storage';
import { AuthService } from './services/auth';
import { AppState, View, User } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { DailyCheckIn } from './views/DailyCheckIn';
import { Habits } from './views/Habits';
import { Okrs } from './views/Okrs';
import { WeeklyReviewView } from './views/WeeklyReview';
import { Insights } from './views/Insights';
import { Settings } from './views/Settings';
import { Auth } from './views/Auth';

const App: React.FC = () => {
  // 1. Initial Load: Check for active session
  const [currentUser, setCurrentUser] = useState<User | null>(() => AuthService.getCurrentSession());
  
  // 2. Load Data: Based on current user ID
  const [state, setState] = useState<AppState>(() => loadState(currentUser?.id || null));
  
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Reload state whenever the user changes (Login/Logout)
  useEffect(() => {
    const loadedData = loadState(currentUser?.id || null);
    setState({
      ...loadedData,
      user: currentUser // Ensure the user object is fresh from session
    });
  }, [currentUser]);

  // Handle HTML Class for Theme
  useEffect(() => {
    if (state.theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [state.theme]);

  // Persist state on every change
  useEffect(() => {
    if (currentUser) {
      saveState(state);
    }
  }, [state, currentUser]);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(updater);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  // RENDER AUTH SCREEN IF NO USER
  if (!currentUser) {
    return (
      <>
        <Background theme={state.theme || 'dark'} />
        <Auth onLogin={handleLogin} theme={state.theme} />
      </>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'checkin': return <DailyCheckIn state={state} updateState={updateState} onComplete={() => setCurrentView('dashboard')} />;
      case 'habits': return <Habits state={state} updateState={updateState} />;
      case 'okrs': return <Okrs state={state} updateState={updateState} />;
      case 'review': return <WeeklyReviewView state={state} updateState={updateState} />;
      case 'insights': return <Insights state={state} updateState={updateState} />;
      case 'settings': return <Settings state={state} updateState={updateState} />;
      default: return <Dashboard state={state} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      setView={setCurrentView} 
      theme={state.theme || 'dark'} 
      toggleTheme={() => updateState(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))}
      state={state}
      updateState={updateState}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
