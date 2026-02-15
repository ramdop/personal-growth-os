import React, { useState, useEffect } from "react";
import { AppState, DailyLog } from "../types";
import { StoicLayout } from "../components/journal/StoicLayout";
import { StoicCard } from "../components/journal/StoicCard";
import { StoicEditor } from "../components/journal/StoicEditor";
import stoicContent from "../data/stoic-content.json";
import stoicThemes from "../data/stoic-themes.json";

interface JournalProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

interface StoicEntry {
  date: string;
  prompt: string;
  quote: string;
  week: string;
  author?: string;
  guidance?: string;
}

import guidedJournalsData from "../data/guided-journals.json";
import { GuidedJournal, GuidedSession } from "../types";

const guidedJournals = guidedJournalsData as GuidedJournal[];

export const Journal: React.FC<JournalProps> = ({ state, updateState }) => {
  const [view, setView] = useState<"library" | "daily" | "guided">("library");
  const [activeGuidedJournal, setActiveGuidedJournal] =
    useState<GuidedJournal | null>(null);
  const [activeGuidedStep, setActiveGuidedStep] = useState(0);
  const [guidedResponses, setGuidedResponses] = useState<
    Record<string, string>
  >({});

  const [step, setStep] = useState<"prompt" | "quote" | "reflect" | "done">(
    "prompt",
  );
  const [entry, setEntry] = useState<StoicEntry | null>(null);
  const [recordedReflection, setRecordedReflection] = useState<string>("");
  const [isWriting, setIsWriting] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [mascot, setMascot] = useState<string>("stoic-owl");

  // Check for existing entry on mount and load content
  useEffect(() => {
    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];

    // Check if we already have a reflection for today
    const existingLog = state.logs.find((l: DailyLog) => l.date === todayISO);
    if (
      existingLog &&
      existingLog.reflection &&
      existingLog.reflection.lesson &&
      existingLog.reflection.lesson.includes("Stoic Reflection:")
    ) {
      setStep("done");
      const parts = existingLog.reflection.lesson.split("Stoic Reflection: ");
      if (parts.length > 1) {
        setRecordedReflection(parts[parts.length - 1]);
      }
    }

    // Use ISO Week logic to ensure consistency across years
    const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return weekNo;
    };

    const currentWeekNumber = getWeekNumber(today);
    const dayOfWeek = today.getDay(); // 0-6 (Sun-Sat)
    // Adjust to Mon=0, Sun=6
    const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Filter content for the current week number
    const weekEntries = (stoicContent as StoicEntry[]).filter((e) => {
      const match = e.week.match(/Week (\d+)/);
      if (match) {
        return parseInt(match[1]) === currentWeekNumber;
      }
      return false;
    });

    // Lookup Theme Title
    const weekTheme =
      (stoicThemes as Record<string, string>)[String(currentWeekNumber)] ||
      "Daily Reflection";

    // If we found entries for this week, pick the one for today
    if (weekEntries.length > 0) {
      // Sort by date to ensure Monday is first
      weekEntries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Pick the entry corresponding to today's index
      const targetEntry = weekEntries[adjustedDayIndex % weekEntries.length];

      const options: Intl.DateTimeFormatOptions = {
        month: "long",
        day: "numeric",
        year: "numeric",
      };

      setEntry({
        ...targetEntry,
        date: today.toLocaleDateString("en-US", options),
        week: `Week ${currentWeekNumber} : ${weekTheme}`,
      });
    } else {
      // Fallback if week not found
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
          1000 /
          60 /
          60 /
          24,
      );
      const fallback = stoicContent[
        dayOfYear % stoicContent.length
      ] as StoicEntry;
      setEntry({
        ...fallback,
        date: today.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    // Dynamic Mascot Logic: Animal Clusters (Wisdom, Courage, Discipline, Perspective)
    const getMascotForWeek = (weekNum: number) => {
      const clusters = {
        wolf: [1, 3, 6, 8, 16, 29, 31, 34, 35, 41, 46, 50, 52], // Discipline / Stoic Strength
        lion: [5, 10, 15, 18, 20, 24, 27, 33, 36, 37, 42, 43, 45], // Courage / Action
        owl: [12, 13, 14, 19, 21, 23, 30, 38, 40, 44, 48, 49, 51], // Wisdom / Reflection
        eagle: [2, 4, 7, 9, 11, 17, 22, 25, 26, 28, 32, 39, 47], // Perspective / Nature
      };

      if (clusters.wolf.includes(weekNum)) return "stoic-wolf";
      if (clusters.lion.includes(weekNum)) return "stoic-lion";
      if (clusters.owl.includes(weekNum)) return "stoic-owl";
      if (clusters.eagle.includes(weekNum)) return "stoic-eagle";
      return "stoic-owl"; // Fallback
    };

    setMascot(getMascotForWeek(currentWeekNumber));
  }, [state.logs]); // Add state.logs as dependency to react to updates

  const handleSave = (reflection: string) => {
    const todayISO = new Date().toISOString().split("T")[0];
    setRecordedReflection(reflection);

    updateState((prev) => {
      const existingLogIndex = prev.logs.findIndex(
        (l: DailyLog) => l.date === todayISO,
      );
      let newLogs = [...prev.logs];

      if (existingLogIndex >= 0) {
        const currentLesson = newLogs[existingLogIndex].reflection.lesson;
        // Prevent duplicateappending if user mashes save or re-enters
        if (currentLesson && currentLesson.includes(reflection)) return prev;

        const newLesson = currentLesson
          ? `${currentLesson}\n\nStoic Reflection: ${reflection}`
          : `Stoic Reflection: ${reflection}`;

        newLogs[existingLogIndex] = {
          ...newLogs[existingLogIndex],
          reflection: {
            ...newLogs[existingLogIndex].reflection,
            lesson: newLesson,
          },
        };
      } else {
        newLogs.push({
          date: todayISO,
          mood: 3,
          energy: 3,
          deepWorkMinutes: 0,
          reps: { presence: false, build: false, workout: false },
          reflection: {
            win: "",
            lesson: `Stoic Reflection: ${reflection}`,
            priority: "",
          },
          habitsCompleted: [],
        });
      }

      return {
        ...prev,
        logs: newLogs,
      };
    });

    setStep("done");
  };

  const saveGuidedSession = (promptId: string, response: string) => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    const newSession: GuidedSession = {
      id: sessionId,
      journalId: activeGuidedJournal!.id,
      date: new Date().toISOString(),
      responses: [{ promptId, response }],
    };

    updateState((prev) => ({
      ...prev,
      guidedSessions: [...(prev.guidedSessions || []), newSession],
      journalProgress: {
        ...(prev.journalProgress || {}),
        [activeGuidedJournal!.id]:
          ((prev.journalProgress || {})[activeGuidedJournal!.id] || 0) + 1,
      },
    }));

    setStep("done");
  };

  if (!entry)
    return (
      <StoicLayout>
        <div className="text-white/50">Loading Daily Stoic...</div>
      </StoicLayout>
    );

  // LIBRARY VIEW
  if (view === "library") {
    return (
      <StoicLayout>
        <div className="w-full max-w-4xl px-6 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-stoic text-white mb-2">Libellum</h1>
            <p className="text-white/40 font-stoic tracking-widest uppercase text-xs">
              MIND AND CHARACTER LIBRARY
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DAILY REFLECTION CARD */}
            <div
              onClick={() => setView("daily")}
              className="bg-white/5 border border-white/10 p-8 rounded-sm cursor-pointer group hover:bg-white/10 transition-all duration-500 flex flex-col justify-between aspect-video md:aspect-auto"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-[10px] font-stoic tracking-[0.2em] text-white/30 uppercase">
                    DAILY PRACTICE
                  </span>
                </div>
                <h3 className="text-xl font-stoic text-white mb-2 group-hover:text-white transition-colors">
                  Daily Reflection
                </h3>
                <p className="text-white/40 text-sm font-sans leading-relaxed">
                  The morning and evening examination of the soul.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] font-stoic text-white/20 tracking-widest uppercase">
                  {step === "done" ? "COMPLETED" : "READY"}
                </span>
                <span className="text-white/20 group-hover:text-white/60 transition-colors">
                  →
                </span>
              </div>
            </div>

            {/* GUIDED JOURNALS */}
            {guidedJournals.map((j) => {
              const progress = state.journalProgress?.[j.id] || 0;
              return (
                <div
                  key={j.id}
                  onClick={() => {
                    const nextPromptIndex = progress % j.prompts.length;
                    setActiveGuidedJournal(j);
                    setActiveGuidedStep(nextPromptIndex);
                    setGuidedResponses({});
                    setView("guided");
                    setStep("prompt");
                  }}
                  className="bg-white/[0.02] border border-white/5 p-8 rounded-sm cursor-pointer group hover:bg-white/10 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">
                      {j.icon}
                    </span>
                    <span className="text-[10px] font-stoic tracking-[0.2em] text-white/20 uppercase">
                      GUIDED JOURNEY
                    </span>
                  </div>
                  <h3 className="text-xl font-stoic text-white mb-2">
                    {j.title}
                  </h3>
                  <p className="text-white/40 text-sm font-sans leading-relaxed">
                    {j.description}
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex-1 flex gap-1">
                      {j.prompts.map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-[2px] transition-all duration-500 ${
                            i < progress % j.prompts.length ||
                            progress >= j.prompts.length
                              ? "bg-white/50"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-[10px] font-stoic text-white/30 tracking-widest">
                      {progress} SESSION{progress !== 1 ? "S" : ""}
                    </span>
                    <span className="text-[10px] font-stoic text-white/20 tracking-widest">
                      LEVEL {Math.floor(progress / 3) + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </StoicLayout>
    );
  }

  // GUIDED FLOW (single prompt per session, rotating)
  if (view === "guided" && activeGuidedJournal) {
    const currentPrompt = activeGuidedJournal.prompts[activeGuidedStep];

    return (
      <StoicLayout>
        {step !== "done" ? (
          <div className="w-full max-w-2xl px-6">
            <header className="mb-12 text-center opacity-40">
              <button
                onClick={() => setView("library")}
                className="text-xs font-stoic tracking-widest uppercase hover:text-white transition-colors"
              >
                ← Return to Library
              </button>
            </header>

            <div className="mb-12">
              <span className="text-[10px] font-stoic tracking-[0.3em] text-white/30 uppercase mb-4 block">
                {activeGuidedJournal.title} • PROMPT {activeGuidedStep + 1} OF{" "}
                {activeGuidedJournal.prompts.length}
              </span>
              <h2 className="text-2xl font-stoic text-white mb-8">
                {currentPrompt.question}
              </h2>
            </div>

            <StoicEditor
              key={currentPrompt.id}
              onSave={(resp) => {
                saveGuidedSession(currentPrompt.id, resp);
              }}
              onFocus={() => setIsWriting(true)}
              onBlur={() => setIsWriting(false)}
            />

            <div
              className={`mt-12 transition-all duration-1000 ${
                isWriting ? "opacity-0 invisible" : "opacity-100 visible"
              }`}
            >
              <h4 className="text-[10px] font-stoic tracking-[0.2em] text-white/40 uppercase mb-4">
                THE STOIC VIEW
              </h4>
              <p className="text-white/60 text-sm leading-relaxed italic border-l border-white/10 pl-6">
                {currentPrompt.guidance}
              </p>
            </div>

            {currentPrompt.detailedGuidance && (
              <div
                className={`w-full max-w-2xl mt-4 transition-all duration-1000 ${
                  isWriting ? "opacity-5 grayscale blur-sm" : "opacity-100"
                }`}
              >
                <button
                  onClick={() => setShowGuidance(!showGuidance)}
                  className="text-xs text-white/30 hover:text-white/60 tracking-widest uppercase mb-4 transition-colors w-full text-center"
                >
                  {showGuidance ? "Hide Guidance" : "Show Guidance"}
                </button>
                <div
                  className={`transition-all duration-1000 overflow-hidden ${
                    showGuidance
                      ? "max-h-[1000px] opacity-100 blur-none grayscale-0"
                      : "max-h-0 opacity-0 blur-md grayscale"
                  }`}
                >
                  <div className="text-white/70 text-sm leading-relaxed font-sans bg-white/5 p-6 rounded-sm border-l-2 border-white/20">
                    {currentPrompt.detailedGuidance
                      .split("\n")
                      .map((line, i) => {
                        if (line.startsWith("##"))
                          return (
                            <h4
                              key={i}
                              className="font-serif text-white/90 text-lg mt-4 mb-2"
                            >
                              {line.replace("## ", "")}
                            </h4>
                          );
                        if (line.match(/^\d+\./))
                          return (
                            <p
                              key={i}
                              className="mb-2 pl-4 border-l border-white/10"
                            >
                              {line}
                            </p>
                          );
                        if (line.trim() === "")
                          return <div key={i} className="h-2" />;
                        return (
                          <p key={i} className="mb-2">
                            {line}
                          </p>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in flex flex-col items-center w-full max-w-2xl px-6 text-center">
            <img
              src={`/assets/${mascot}.png`}
              alt="Stoic Mascot"
              className="w-48 h-48 mb-12 opacity-60"
            />
            <h2 className="text-3xl font-stoic text-white mb-6">
              Journey Advanced
            </h2>
            <p className="text-white/40 font-stoic text-sm tracking-wide mb-12">
              Building the inner citadel, brick by brick.
            </p>
            <button
              onClick={() => setView("library")}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-sm transition-all text-xs tracking-[0.2em] font-stoic uppercase"
            >
              Return Home
            </button>
          </div>
        )}
      </StoicLayout>
    );
  }

  // DAILY FLOW (Existing Logic wrapped)
  return (
    <StoicLayout>
      <div className="mb-8 w-full flex justify-center opacity-40">
        <button
          onClick={() => setView("library")}
          className="text-xs font-stoic tracking-widest uppercase hover:text-white transition-colors"
        >
          ← Library
        </button>
      </div>
      {step === "prompt" && (
        <div onClick={() => setStep("quote")} className="cursor-pointer group">
          <span className="text-xs font-stoic tracking-widest text-white/40 uppercase mb-8 block animate-fade-in">
            {entry.week}
          </span>
          <StoicCard type="prompt" content={entry.prompt} date={entry.date} />
          <div className="mt-12 text-white/20 text-sm font-stoic tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            TAP TO REVEAL QUOTE
          </div>
        </div>
      )}

      {step === "quote" && (
        <div
          onClick={() => setStep("reflect")}
          className="cursor-pointer group"
        >
          <StoicCard
            type="quote"
            content={entry.quote}
            author={entry.author || "Stoic Philosophy"}
          />
          <div className="mt-12 text-white/20 text-sm font-stoic tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            TAP TO REFLECT
          </div>
        </div>
      )}

      {step === "reflect" && (
        <div className="w-full flex flex-col items-center">
          <div
            className={`mb-8 scale-90 transition-all duration-1000 ${
              isWriting ? "opacity-5 grayscale blur-sm" : "opacity-60"
            }`}
          >
            <StoicCard type="prompt" content={entry.prompt} />
          </div>
          <StoicEditor
            onSave={handleSave}
            onFocus={() => setIsWriting(true)}
            onBlur={() => setIsWriting(false)}
          />
          {entry.guidance && (
            <div
              className={`w-full max-w-2xl mt-4 transition-all duration-1000 ${
                isWriting ? "opacity-5 grayscale blur-sm" : "opacity-100"
              }`}
            >
              <button
                onClick={() => setShowGuidance(!showGuidance)}
                className="text-xs text-white/30 hover:text-white/60 tracking-widest uppercase mb-4 transition-colors w-full text-center"
              >
                {showGuidance ? "Hide Guidance" : "Show Guidance"}
              </button>
              <div
                className={`transition-all duration-1000 overflow-hidden ${
                  showGuidance
                    ? "max-h-[1000px] opacity-100 blur-none grayscale-0"
                    : "max-h-0 opacity-0 blur-md grayscale"
                }`}
              >
                <div className="text-white/70 text-sm leading-relaxed font-sans bg-white/5 p-6 rounded-sm border-l-2 border-white/20">
                  {entry.guidance.split("\n").map((line, i) => {
                    if (line.startsWith("##"))
                      return (
                        <h4
                          key={i}
                          className="font-serif text-white/90 text-lg mt-4 mb-2"
                        >
                          {line.replace("## ", "")}
                        </h4>
                      );
                    if (line.match(/^\d+\./))
                      return (
                        <p
                          key={i}
                          className="mb-2 pl-4 border-l border-white/10"
                        >
                          {line}
                        </p>
                      );
                    if (line.trim() === "")
                      return <div key={i} className="h-2" />;
                    return (
                      <p key={i} className="mb-2">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="animate-fade-in flex flex-col items-center w-full max-w-2xl px-6 text-center">
          <img
            src={`/assets/${mascot}.png`}
            alt="Stoic Mascot"
            className="w-48 h-48 mb-6 opacity-60 hover:opacity-100 transition-opacity duration-1000"
          />
          <h2 className="text-3xl font-stoic text-white mb-6">
            Reflection Recorded
          </h2>
          <div className="text-white/80 font-stoic text-lg leading-relaxed text-center mb-8 italic bg-white/5 p-6 rounded-lg border border-white/10 w-full animate-fade-in-up">
            "{recordedReflection}"
          </div>
          <p className="text-white/40 font-stoic text-sm tracking-wide mb-8">
            You have strengthened your mind today.
          </p>

          <button
            onClick={() => setStep("prompt")}
            className="text-white/40 hover:text-white text-xs tracking-widest uppercase transition-colors"
          >
            Review Again
          </button>
        </div>
      )}
    </StoicLayout>
  );
};
