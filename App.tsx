import React, { useState, useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Background } from "./components/Background";
import { loadState, saveState } from "./services/storage";
import { AuthService } from "./services/auth";
import { supabase } from "./services/supabase";
import { AppState, View, User } from "./types";
import { Layout } from "./components/Layout";
import { Dashboard } from "./views/Dashboard";
import { DailyCheckIn } from "./views/DailyCheckIn";
import { Habits } from "./views/Habits";
import { Okrs } from "./views/Okrs";
import { WeeklyReviewView } from "./views/WeeklyReview";
import { Insights } from "./views/Insights";
import { Settings } from "./views/Settings";
import { Auth } from "./views/Auth";
import { Landing } from "./views/Landing";
import { Privacy } from "./views/Privacy";
import { Terms } from "./views/Terms";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [state, setState] = useState<AppState>({
    user: null,
    theme: "dark",
    logs: [],
    habits: [],
    objectives: [],
    reviews: [],
    unlockedVisualizations: [],
    memories: [],
    systemPrompt: "",
  });
  const [currentView, setCurrentView] = useState<View>("dashboard");

  // 1. Initial Load: Check for active session & Handle Deep Links
  useEffect(() => {
    const init = async () => {
      const user = await AuthService.getCurrentSession();
      setCurrentUser(user);

      const loadedData = await loadState(user?.id || null);
      setState({ ...loadedData, user });
      setLoading(false);
    };
    init();

    // Listen for Deep Links (OAuth Redirects)
    CapacitorApp.addListener("appUrlOpen", async (event) => {
      console.log("[App] Deep Link Received:", event.url);

      // Close the In-App Browser if it's open
      await Browser.close();

      // The URL will look like: com.personalgrowth.os://google-auth#access_token=...&refresh_token=...
      // We need to parse the fragment manually because Supabase client doesn't see the native URL change.

      try {
        const url = new URL(event.url);
        // Supabase usually puts tokens in the hash (#) but sometimes in search (?) depending on config
        // We'll check both.
        const params = new URLSearchParams(url.hash.substring(1)); // Remove '#'
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("[App] Setting session from native url...");
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (data.user) {
            console.log("[App] Session set successfully:", data.user.email);
            const mappedUser: User = {
              id: data.user.id,
              email: data.user.email || "",
              name: data.user.user_metadata?.name || "User",
            };
            setCurrentUser(mappedUser);
          } else if (error) {
            console.error("[App] Failed to set session:", error);
          }
        } else {
          console.log("[App] No tokens found in URL");
        }
      } catch (e) {
        console.error("[App] Failed to parse deep link:", e);
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // Reload state whenever the user changes (Login/Logout)
  useEffect(() => {
    if (loading) return; // Don't trigger during init
    const fetchData = async () => {
      const loadedData = await loadState(currentUser?.id || null);
      setState({
        ...loadedData,
        user: currentUser,
      });
    };
    fetchData();
  }, [currentUser]);

  // Handle HTML Class for Theme
  useEffect(() => {
    if (state.theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
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

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
  };

  // RENDER PUBLIC PAGES (Bypass Auth)
  const path = window.location.pathname;
  if (path === "/privacy") return <Privacy />;
  if (path === "/terms") return <Terms />;

  // RENDER AUTH SCREEN IF NO USER
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // RENDER AUTH SCREEN OR LANDING IF NO USER
  if (!currentUser) {
    if (showAuth || window.location.pathname === "/login") {
      return (
        <>
          <Background theme={state.theme || "dark"} />
          <Auth onLogin={handleLogin} theme={state.theme} />
        </>
      );
    }
    return <Landing onLogin={() => setShowAuth(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard state={state} />;
      case "checkin":
        return (
          <DailyCheckIn
            state={state}
            updateState={updateState}
            onComplete={() => setCurrentView("dashboard")}
          />
        );
      case "habits":
        return <Habits state={state} updateState={updateState} />;
      case "okrs":
        return <Okrs state={state} updateState={updateState} />;
      case "review":
        return <WeeklyReviewView state={state} updateState={updateState} />;
      case "insights":
        return <Insights state={state} updateState={updateState} />;
      case "settings":
        return <Settings state={state} updateState={updateState} />;
      default:
        return <Dashboard state={state} />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      setView={setCurrentView}
      theme={state.theme || "dark"}
      toggleTheme={() =>
        updateState((s) => ({
          ...s,
          theme: s.theme === "light" ? "dark" : "light",
        }))
      }
      state={state}
      updateState={updateState}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
