import React, { useState, useEffect, useRef, useMemo } from "react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, LogType } from "../types";
import {
  Compass,
  X,
  Send,
  Activity,
  Loader2,
  Terminal,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  DEFAULT_SYSTEM_PROMPT,
  SUGGESTION_PROTOCOL,
  MEMORY_PROTOCOL,
  CONVERSATIONAL_PROTOCOL,
  CALENDAR_PROTOCOL,
  JOURNAL_PROTOCOL,
} from "../constants";
import { CalendarService } from "../services/calendar";
import stoicContent from "../data/stoic-content.json";
import guidedJournals from "../data/guided-journals.json";
import stoicThemes from "../data/stoic-themes.json";
import ReactMarkdown from "react-markdown";

// --- Tool Declarations ---

const getAppStateDecl: FunctionDeclaration = {
  name: "getAppState",
  description:
    "Get the current state of the user app, including logs, habits, and objectives.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const logDailyCheckInDecl: FunctionDeclaration = {
  name: "logDailyCheckIn",
  description:
    "Log or update the daily check-in. Partial updates are allowed (e.g., just logging mood).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: { type: Type.NUMBER, description: "Mood 1-5" },
      energy: { type: Type.NUMBER, description: "Energy 1-5" },
      deepWorkMinutes: {
        type: Type.NUMBER,
        description: "Minutes of deep work",
      },
      presenceRep: { type: Type.BOOLEAN },
      buildRep: { type: Type.BOOLEAN },
      workoutRep: { type: Type.BOOLEAN },

      win: { type: Type.STRING },
      lesson: { type: Type.STRING },
      priority: { type: Type.STRING },
    },
    required: [], // Made optional to allow conversational, multi-step check-ins
  },
};

const addHabitDecl: FunctionDeclaration = {
  name: "addHabit",
  description: "Create a new habit to track.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Habit name" },
      category: {
        type: Type.STRING,
        description: "Category: presence, builder, health, mind",
      },
    },
    required: ["name", "category"],
  },
};

const updateHabitDecl: FunctionDeclaration = {
  name: "updateHabit",
  description:
    "Update an existing habit (rename, change category, or archive) by searching for its name.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetName: {
        type: Type.STRING,
        description: "The current name of the habit to update (fuzzy match)",
      },
      newName: { type: Type.STRING, description: "The new name (optional)" },
      newCategory: {
        type: Type.STRING,
        description: "The new category (optional)",
      },
      active: {
        type: Type.BOOLEAN,
        description: "Set to false to archive/deactivate (optional)",
      },
    },
    required: ["targetName"],
  },
};

const removeHabitDecl: FunctionDeclaration = {
  name: "removeHabit",
  description: "Delete a habit by searching for its name.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The name of the habit to remove (fuzzy match)",
      },
    },
    required: ["name"],
  },
};

const addObjectiveDecl: FunctionDeclaration = {
  name: "addObjective",
  description: "Add a new annual objective.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      theme: { type: Type.STRING },
      why: { type: Type.STRING },
    },
    required: ["title", "theme", "why"],
  },
};

const updateObjectiveDecl: FunctionDeclaration = {
  name: "updateObjective",
  description: "Update an existing Objective details or status.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      targetTitle: {
        type: Type.STRING,
        description: "Current title (fuzzy match)",
      },
      newTitle: { type: Type.STRING },
      newTheme: { type: Type.STRING },
      newWhy: { type: Type.STRING },
      active: { type: Type.BOOLEAN },
    },
    required: ["targetTitle"],
  },
};

const removeObjectiveDecl: FunctionDeclaration = {
  name: "removeObjective",
  description: "Delete an entire Objective and all its Key Results.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Title of the objective to remove (fuzzy match)",
      },
    },
    required: ["title"],
  },
};

const addKeyResultDecl: FunctionDeclaration = {
  name: "addKeyResult",
  description: "Add a key result to an existing objective.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      objectiveTitle: {
        type: Type.STRING,
        description: "The exact title of the objective to match.",
      },
      title: { type: Type.STRING, description: "Key Result title" },
      target: {
        type: Type.STRING,
        description: "Target metric or qualitative state",
      },
    },
    required: ["objectiveTitle", "title", "target"],
  },
};

const updateKeyResultDecl: FunctionDeclaration = {
  name: "updateKeyResult",
  description: "Update a Key Result details, progress, or confidence.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      objectiveTitle: {
        type: Type.STRING,
        description:
          "The title of the objective containing the KR (fuzzy match)",
      },
      krTitle: {
        type: Type.STRING,
        description: "The current title of the KR (fuzzy match)",
      },
      newTitle: { type: Type.STRING },
      newTarget: { type: Type.STRING },
      newCurrent: {
        type: Type.STRING,
        description: 'Current progress value (e.g., "5/10 books")',
      },
      newConfidence: { type: Type.NUMBER, description: "Confidence score 1-5" },
    },
    required: ["objectiveTitle", "krTitle"],
  },
};

const removeKeyResultDecl: FunctionDeclaration = {
  name: "removeKeyResult",
  description: "Remove a key result from an objective.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      objectiveTitle: {
        type: Type.STRING,
        description:
          "The title of the objective containing the KR (fuzzy match).",
      },
      keyResultTitle: {
        type: Type.STRING,
        description: "The title of the Key Result to remove (fuzzy match).",
      },
    },
    required: ["objectiveTitle", "keyResultTitle"],
  },
};

const rememberFactDecl: FunctionDeclaration = {
  name: "rememberFact",
  description:
    "Store a lasting memory about the user (e.g., job, age, core values, life events). Use this when the user shares something significant that should be recalled in future sessions. Do not use for trivial things.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fact: {
        type: Type.STRING,
        description: "The specific fact to remember.",
      },
      category: {
        type: Type.STRING,
        description: "identity, preference, history, or other",
      },
    },
    required: ["fact", "category"],
  },
};

const forgetFactDecl: FunctionDeclaration = {
  name: "forgetFact",
  description: "Remove a specific memory from long-term storage.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      memoryId: {
        type: Type.STRING,
        description: "The ID of the memory to remove.",
      },
    },
    required: ["memoryId"],
  },
};

const getJournalContextDecl: FunctionDeclaration = {
  name: "getJournalContext",
  description:
    "Get journal context: today's daily Stoic prompt, available guided journals with completion progress, and recent guided session history. Use this when the user asks about journals, prompts, or journaling progress.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const addCalendarEventDecl: FunctionDeclaration = {
  name: "addCalendarEvent",
  description:
    "Add an event to the user's Google Calendar. CALL THIS IMMEDIATELY if the user asks to schedule something. Do not ask for confirmation textually, the UI will handle it.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Event title" },
      startTime: {
        type: Type.STRING,
        description: "ISO 8601 start time (e.g., 2024-02-01T10:00:00)",
      },
      endTime: { type: Type.STRING, description: "ISO 8601 end time" },
      description: { type: Type.STRING, description: "Optional description" },
    },
    required: ["title", "startTime", "endTime"],
  },
};

const listCalendarEventsDecl: FunctionDeclaration = {
  name: "listCalendarEvents",
  description:
    "List upcoming calendar events to check availability or find events to update/delete.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      timeMin: {
        type: Type.STRING,
        description: "ISO 8601 start time (default: now)",
      },
      timeMax: {
        type: Type.STRING,
        description: "ISO 8601 end time (default: 1 week from now)",
      },
      maxResults: {
        type: Type.NUMBER,
        description: "Max number of events to return",
      },
    },
    required: [],
  },
};

const updateCalendarEventDecl: FunctionDeclaration = {
  name: "updateCalendarEvent",
  description:
    "Update an existing calendar event. You typically need to call 'listCalendarEvents' first to get the eventId.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: {
        type: Type.STRING,
        description: "The ID of the event to update",
      },
      title: { type: Type.STRING, description: "New title" },
      startTime: {
        type: Type.STRING,
        description: "New start time (ISO 8601)",
      },
      endTime: { type: Type.STRING, description: "New end time (ISO 8601)" },
      description: { type: Type.STRING, description: "New description" },
    },
    required: ["eventId"],
  },
};

const deleteCalendarEventDecl: FunctionDeclaration = {
  name: "deleteCalendarEvent",
  description:
    "Delete a calendar event. You typically need to call 'listCalendarEvents' first to get the eventId.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: {
        type: Type.STRING,
        description: "The ID of the event to delete",
      },
    },
    required: ["eventId"],
  },
};

interface AICompanionProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

interface Message {
  id: string;
  role: "user" | "model" | "system";
  text?: string;
  isActionRequired?: boolean;
  toolCalls?: any[]; // The tool calls awaiting approval
  safeResults?: any[]; // The results of safe tools executed in parallel
  actionStatus?: "pending" | "approved" | "denied";
  suggestions?: string[]; // Extracted follow-up suggestions
}

export const AICompanion: React.FC<AICompanionProps> = ({
  state,
  updateState,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Suggestions based on User State (Cold Start vs. Active)
  const suggestions = useMemo(() => {
    const isColdStart =
      state.habits.length === 0 && state.objectives.length === 0;

    if (isColdStart) {
      return [
        {
          label: "Discover Habits",
          text: "Help me design habits based on the identity I want to build.",
          icon: "🌱",
          desc: "Setup your system",
        },
        {
          label: "Define Vision",
          text: "Help me draft my annual objectives and themes.",
          icon: "🔭",
          desc: "Set your direction",
        },
        {
          label: "Explain Logic",
          text: "What is the philosophy behind this system?",
          icon: "🧠",
          desc: "Understand the OS",
        },
        {
          label: "Daily Check-in",
          text: "Start daily check-in",
          icon: "📝",
          desc: "Log mood & reps",
        },
      ];
    }

    return [
      {
        label: "Daily Check-in",
        text: "Start daily check-in",
        icon: "📝",
        desc: "Log mood & reps",
      },
      {
        label: "Analyze Signal",
        text: "How am I doing based on my logs?",
        icon: "📊",
        desc: "Data-driven insights",
      },
      {
        label: "Add Habit",
        text: "I want to add a new habit",
        icon: "✨",
        desc: "Track a new behavior",
      },
      {
        label: "Set Objective",
        text: "Help me set a new objective",
        icon: "🎯",
        desc: "Define annual goals",
      },
    ];
  }, [state.habits.length, state.objectives.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, isOpen]);

  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY || "",
        });

        const baseInstruction = state.systemPrompt || DEFAULT_SYSTEM_PROMPT;

        // Prepare context summary
        const habitCount = state.habits.filter((h) => h.active).length;
        const objectiveCount = state.objectives.filter((o) => o.active).length;
        const lastLog =
          state.logs.length > 0 ? state.logs[state.logs.length - 1] : null;
        const lastLogDate = lastLog ? lastLog.date : "None";
        const lastMood = lastLog ? lastLog.mood : "Unknown";

        // Memory Injection
        const memoriesList =
          state.memories && state.memories.length > 0
            ? state.memories
                .map(
                  (m) =>
                    `- [${m.category.toUpperCase()}] ${m.content} (ID: ${
                      m.id
                    })`,
                )
                .join("\n")
            : "No long-term memories stored yet.";

        // Journal context summary
        const sessionCount = state.guidedSessions?.length || 0;
        const journalProgressSummary =
          state.journalProgress && Object.keys(state.journalProgress).length > 0
            ? Object.entries(state.journalProgress)
                .map(([jId, count]) => {
                  const journal = (guidedJournals as any[]).find(
                    (j: any) => j.id === jId,
                  );
                  return journal
                    ? `${journal.title}: ${count} session(s)`
                    : null;
                })
                .filter(Boolean)
                .join(", ") || "None yet"
            : "None yet";
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
          ((now.getTime() - startOfYear.getTime()) / 86400000 +
            startOfYear.getDay() +
            1) /
            7,
        );
        const currentTheme =
          (stoicThemes as Record<string, string>)[String(weekNumber)] ||
          "Reflection";

        const identityContext = `\n\nUSER IDENTITY:\nName: ${
          state.user?.name || "User"
        }\nEmail: ${
          state.user?.email || "Unknown"
        }\nCurrent Date: ${new Date().toLocaleDateString()}\n\nCONTEXT SUMMARY:\nActive Habits: ${habitCount}\nActive Objectives: ${objectiveCount}\nLast Check-in: ${lastLogDate} (Mood: ${lastMood})\n\nJOURNAL CONTEXT:\nGuided Sessions Completed: ${sessionCount}\nJournal Progress: ${journalProgressSummary}\nThis Week's Theme: Week ${weekNumber} — ${currentTheme}\n\nSIGNALS MEMORY (LONG-TERM):\n${memoriesList}\n\n${MEMORY_PROTOCOL}\n\n${CONVERSATIONAL_PROTOCOL}\n\n${CALENDAR_PROTOCOL}\n\n${JOURNAL_PROTOCOL}\n\nNOTE: You have access to the full user state via the 'getAppState' tool. If the user asks about specific habits, logs, or goals, USE THE TOOL to get the details. To store new important facts, use 'rememberFact'. For journal details, use 'getJournalContext'.`;

        // FORCE INJECT PROTOCOL:
        // Even if user customized their prompt, this protocol is appended to ensure UI works.
        const systemInstruction = `${baseInstruction}${identityContext}\n\n${SUGGESTION_PROTOCOL}\n\nCRITICAL PROTOCOL: Do not ask for verbal confirmation before calling a tool. If the user asks to modify data (add/edit/delete) or shares new important life details (calling for memory storage), call the tool immediately. The system will trigger a UI confirmation card automatically.`;

        chatRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: systemInstruction,
            tools: [
              {
                functionDeclarations: [
                  getAppStateDecl,
                  logDailyCheckInDecl,
                  addHabitDecl,
                  updateHabitDecl,
                  removeHabitDecl,
                  addObjectiveDecl,
                  updateObjectiveDecl,
                  removeObjectiveDecl,
                  addKeyResultDecl,
                  updateKeyResultDecl,
                  removeKeyResultDecl,
                  rememberFactDecl,
                  forgetFactDecl,
                  addCalendarEventDecl,
                  listCalendarEventsDecl,
                  updateCalendarEventDecl,
                  deleteCalendarEventDecl,
                  getJournalContextDecl,
                ],
              },
            ],
          },
        });

        setMessages((prev) => {
          if (prev.length === 0) {
            return [
              {
                id: "init",
                role: "model",
                text: "I am Signal. I am here to help you filter the noise. How is your alignment today?",
              },
            ];
          }
          return [
            ...prev,
            {
              id: Date.now().toString(),
              role: "system",
              text: "System instructions updated.",
            },
          ];
        });
      } catch (e) {
        console.error("Failed to init chat", e);
      }
    };
    initChat();
  }, [state.systemPrompt, state.user?.name]);

  const executeTool = async (call: any) => {
    const { name, args } = call;
    console.log(`[AI] Executing tool: ${name}`, args);

    try {
      if (name === "getAppState") {
        // Return the full state directly from props to ensure latest data
        return state;
      }

      if (name === "getJournalContext") {
        // Today's daily Stoic entry
        const todayStr = new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const todayEntry = (stoicContent as any[]).find(
          (e: any) => e.date === todayStr,
        );
        const dailyStoic = todayEntry
          ? {
              date: todayEntry.date,
              prompt: todayEntry.prompt,
              quote: todayEntry.quote,
              author: todayEntry.author,
              week: todayEntry.week,
            }
          : { message: "No entry found for today" };

        // Available journals with progress
        const journalCatalog = (guidedJournals as any[]).map((j: any) => ({
          id: j.id,
          title: j.title,
          description: j.description,
          promptCount: j.prompts?.length || 0,
          sessionsCompleted: state.journalProgress?.[j.id] || 0,
          timesFullyCompleted: Math.floor(
            (state.journalProgress?.[j.id] || 0) / (j.prompts?.length || 1),
          ),
        }));

        // Recent guided sessions (last 5)
        const recentSessions = (state.guidedSessions || [])
          .slice(-5)
          .map((s: any) => {
            const journal = (guidedJournals as any[]).find(
              (j: any) => j.id === s.journalId,
            );
            return {
              date: s.date,
              journalTitle: journal?.title || s.journalId,
              responseCount: s.responses?.length || 0,
            };
          });

        return {
          dailyStoic,
          availableJournals: journalCatalog,
          recentSessions,
          totalSessionsEver: state.guidedSessions?.length || 0,
        };
      }

      if (name === "logDailyCheckIn") {
        const today = new Date().toISOString().split("T")[0];
        updateState((prev) => {
          const existing = prev.logs.find((l) => l.date === today);
          const newLog = {
            date: today,
            mood: args.mood ?? existing?.mood ?? 3,
            energy: args.energy ?? existing?.energy ?? 3,
            deepWorkMinutes:
              args.deepWorkMinutes ?? existing?.deepWorkMinutes ?? 0,
            reps: {
              presence: args.presenceRep ?? existing?.reps.presence ?? false,
              build: args.buildRep ?? existing?.reps.build ?? false,
              workout: args.workoutRep ?? existing?.reps.workout ?? false,
            },
            reflection: {
              win: args.win ?? existing?.reflection.win ?? "",
              lesson: args.lesson ?? existing?.reflection.lesson ?? "",
              priority: args.priority ?? existing?.reflection.priority ?? "",
            },
            habitsCompleted: existing?.habitsCompleted ?? [],
          };
          return {
            ...prev,
            logs: [...prev.logs.filter((l) => l.date !== today), newLog],
          };
        });
        return { status: "success", message: "Daily log updated." };
      }

      if (name === "addHabit") {
        updateState((prev) => ({
          ...prev,
          habits: [
            ...prev.habits,
            {
              id: Date.now().toString(),
              name: args.name,
              category: args.category as LogType,
              active: true,
            },
          ],
        }));
        return { status: "success", message: `Habit '${args.name}' created.` };
      }

      if (name === "updateHabit") {
        const targetHabit = state.habits.find((h) =>
          h.name.toLowerCase().includes(args.targetName.toLowerCase()),
        );

        if (!targetHabit) {
          return { error: `Habit similar to "${args.targetName}" not found.` };
        }

        updateState((prev) => ({
          ...prev,
          habits: prev.habits.map((h) =>
            h.id !== targetHabit.id
              ? h
              : {
                  ...h,
                  name: args.newName || h.name,
                  category: (args.newCategory as LogType) || h.category,
                  active: args.active !== undefined ? args.active : h.active,
                },
          ),
        }));
        return {
          status: "success",
          message: `Habit "${targetHabit.name}" updated.`,
        };
      }

      if (name === "removeHabit") {
        const targetHabit = state.habits.find((h) =>
          h.name.toLowerCase().includes(args.name.toLowerCase()),
        );
        if (!targetHabit) {
          return { error: `Habit similar to "${args.name}" not found.` };
        }
        updateState((prev) => ({
          ...prev,
          habits: prev.habits.filter((h) => h.id !== targetHabit.id),
        }));
        return {
          status: "success",
          message: `Habit "${targetHabit.name}" removed.`,
        };
      }

      if (name === "addObjective") {
        updateState((prev) => ({
          ...prev,
          objectives: [
            ...prev.objectives,
            {
              id: Date.now().toString(),
              year: new Date().getFullYear(),
              theme: args.theme,
              title: args.title,
              why: args.why,
              active: true,
              keyResults: [],
            },
          ],
        }));
        return { status: "success", message: "Objective added." };
      }

      if (name === "updateObjective") {
        const targetObj = state.objectives.find((o) =>
          o.title.toLowerCase().includes(args.targetTitle.toLowerCase()),
        );
        if (!targetObj)
          return { error: `Objective "${args.targetTitle}" not found.` };

        updateState((prev) => ({
          ...prev,
          objectives: prev.objectives.map((o) =>
            o.id !== targetObj.id
              ? o
              : {
                  ...o,
                  title: args.newTitle || o.title,
                  theme: args.newTheme || o.theme,
                  why: args.newWhy || o.why,
                  active: args.active !== undefined ? args.active : o.active,
                },
          ),
        }));
        return { status: "success", message: "Objective updated." };
      }

      if (name === "removeObjective") {
        const targetObj = state.objectives.find((o) =>
          o.title.toLowerCase().includes(args.title.toLowerCase()),
        );
        if (!targetObj)
          return { error: `Objective "${args.title}" not found.` };

        updateState((prev) => ({
          ...prev,
          objectives: prev.objectives.filter((o) => o.id !== targetObj.id),
        }));
        return {
          status: "success",
          message: `Objective "${targetObj.title}" removed.`,
        };
      }

      if (name === "addKeyResult") {
        const targetObj = state.objectives.find((o) =>
          o.title.toLowerCase().includes(args.objectiveTitle.toLowerCase()),
        );

        if (!targetObj) {
          return {
            error: `Objective containing "${args.objectiveTitle}" not found.`,
          };
        }

        updateState((prev) => ({
          ...prev,
          objectives: prev.objectives.map((o) =>
            o.id !== targetObj.id
              ? o
              : {
                  ...o,
                  keyResults: [
                    ...o.keyResults,
                    {
                      id: Date.now().toString(),
                      title: args.title,
                      target: args.target,
                      current: "Not started",
                      confidence: 3,
                    },
                  ],
                },
          ),
        }));
        return { status: "success", message: "Key Result added." };
      }

      if (name === "updateKeyResult") {
        let foundObj = false;
        let foundKr = false;

        updateState((prev) => {
          const targetObj = prev.objectives.find((o) =>
            o.title.toLowerCase().includes(args.objectiveTitle.toLowerCase()),
          );
          if (!targetObj) return prev;
          foundObj = true;

          const targetKr = targetObj.keyResults.find((k) =>
            k.title.toLowerCase().includes(args.krTitle.toLowerCase()),
          );
          if (!targetKr) return prev;
          foundKr = true;

          return {
            ...prev,
            objectives: prev.objectives.map((o) =>
              o.id !== targetObj.id
                ? o
                : {
                    ...o,
                    keyResults: o.keyResults.map((k) =>
                      k.id !== targetKr.id
                        ? k
                        : {
                            ...k,
                            title: args.newTitle || k.title,
                            target: args.newTarget || k.target,
                            current: args.newCurrent || k.current,
                            confidence: args.newConfidence || k.confidence,
                          },
                    ),
                  },
            ),
          };
        });

        if (!foundObj)
          return { error: `Objective "${args.objectiveTitle}" not found.` };
        if (!foundKr)
          return { error: `Key Result "${args.krTitle}" not found.` };

        return { status: "success", message: "Key Result updated." };
      }

      if (name === "removeKeyResult") {
        let foundObj = false;
        let foundKr = false;

        updateState((prev) => {
          const targetObj = prev.objectives.find((o) =>
            o.title.toLowerCase().includes(args.objectiveTitle.toLowerCase()),
          );
          if (!targetObj) return prev;
          foundObj = true;

          const targetKr = targetObj.keyResults.find((k) =>
            k.title.toLowerCase().includes(args.keyResultTitle.toLowerCase()),
          );
          if (!targetKr) return prev;
          foundKr = true;

          return {
            ...prev,
            objectives: prev.objectives.map((o) =>
              o.id !== targetObj.id
                ? o
                : {
                    ...o,
                    keyResults: o.keyResults.filter(
                      (k) => k.id !== targetKr.id,
                    ),
                  },
            ),
          };
        });

        if (!foundObj)
          return {
            error: `Objective similar to "${args.objectiveTitle}" not found.`,
          };
        if (!foundKr)
          return {
            error: `Key Result similar to "${args.keyResultTitle}" not found in objective "${args.objectiveTitle}".`,
          };

        return { status: "success", message: "Key Result removed." };
      }

      if (name === "rememberFact") {
        updateState((prev) => ({
          ...prev,
          memories: [
            ...(prev.memories || []),
            {
              id: Date.now().toString(),
              content: args.fact,
              category: args.category || "other",
              addedAt: new Date().toISOString(),
            },
          ],
        }));
        return { status: "success", message: "Memory stored." };
      }

      if (name === "forgetFact") {
        updateState((prev) => ({
          ...prev,
          memories: (prev.memories || []).filter((m) => m.id !== args.memoryId),
        }));
        return { status: "success", message: "Memory removed." };
      }

      if (name === "addCalendarEvent") {
        const result = await CalendarService.createEvent({
          title: args.title,
          startTime: args.startTime,
          endTime: args.endTime,
          description: args.description,
        });

        if (!result.success && result.error === "PERMISSION_MISSING") {
          return {
            status: "error",
            message:
              'PERMISSION DENIED: I do not have permission to access your calendar yet. Please instruct the user to "Sign out and sign in again" to grant Google Calendar access.',
          };
        }

        if (!result.success) {
          return { status: "error", message: result.error };
        }
        return { status: "success", message: `Event created: ${result.link}` };
      }

      if (name === "listCalendarEvents") {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const result = await CalendarService.listEvents(
          args.timeMin || now.toISOString(),
          args.timeMax || nextWeek.toISOString(),
          args.maxResults || 10,
        );

        if (!result.success && result.error === "PERMISSION_MISSING") {
          return {
            status: "error",
            message: "PERMISSION DENIED: Instruct user to sign in again.",
          };
        }
        return result;
      }

      if (name === "updateCalendarEvent") {
        const result = await CalendarService.updateEvent(args.eventId, {
          title: args.title,
          startTime: args.startTime,
          endTime: args.endTime,
          description: args.description,
        });

        if (!result.success && result.error === "PERMISSION_MISSING") {
          return {
            status: "error",
            message: "PERMISSION DENIED: Instruct user to sign in again.",
          };
        }
        return result;
      }

      if (name === "deleteCalendarEvent") {
        const result = await CalendarService.deleteEvent(args.eventId);

        if (!result.success && result.error === "PERMISSION_MISSING") {
          return {
            status: "error",
            message: "PERMISSION DENIED: Instruct user to sign in again.",
          };
        }
        return { status: "success", message: "Event deleted." };
      }

      return { error: "Unknown tool" };
    } catch (e) {
      console.error(e);
      return { error: "Execution failed" };
    }
  };

  const processModelResponse = async (response: any) => {
    let responseText = response.text || "";
    let extractedSuggestions: string[] = [];

    // 1. Parse Suggestion Tags
    if (responseText) {
      const suggestRegex = /<suggest>(.*?)<\/suggest>/g;
      let match;
      while ((match = suggestRegex.exec(responseText)) !== null) {
        extractedSuggestions.push(match[1].trim());
      }
      // Remove tags from displayed text
      responseText = responseText.replace(suggestRegex, "").trim();
    }

    // 2. Handle Text (if present)
    // Note: We delay adding the message if we have tool calls, to avoid splitting state
    // But for simplicity, we add text first.
    // CRITICAL: If tool calls exist, we must WIPE suggestions to avoid clutter.
    if (response.functionCalls && response.functionCalls.length > 0) {
      extractedSuggestions = [];
    }

    if (responseText && responseText.trim().length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: responseText,
          suggestions:
            extractedSuggestions.length > 0 ? extractedSuggestions : undefined,
        },
      ]);
    } else if (
      response.functionCalls &&
      response.functionCalls.some((c: any) => c.name === "rememberFact")
    ) {
      // SYNTHETIC RESPONSE: If model is silent but proposes a memory, force a text response.
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: "I've drafted a memory card for that detail.",
          suggestions: undefined,
        },
      ]);
    }

    // 3. Handle Function Calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const calls = response.functionCalls;
      const safeCalls = calls.filter((c: any) => c.name === "getAppState");
      const unsafeCalls = calls.filter((c: any) => c.name !== "getAppState");

      // Execute safe calls immediately (parallel)
      const safeResults = await Promise.all(
        safeCalls.map(async (call: any) => {
          const result = await executeTool(call);
          return {
            functionResponse: {
              id: call.id, // Important: pass back ID
              name: call.name,
              response: { result },
            },
          };
        }),
      );

      // If there are modification calls, HALT and show approval UI
      if (unsafeCalls.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "system",
            isActionRequired: true,
            toolCalls: unsafeCalls,
            safeResults: safeResults,
            actionStatus: "pending",
          },
        ]);
        setIsProcessing(false); // Stop spinner, wait for user
      } else {
        // If only safe calls, continue loop automatically
        const nextResponse = await chatRef.current.sendMessage({
          message: safeResults,
        });
        await processModelResponse(nextResponse);
      }
    } else {
      setIsProcessing(false); // Done
    }
  };

  const handleActionDecision = async (message: Message, approved: boolean) => {
    if (!message.toolCalls) return;

    // Update UI status immediately
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, actionStatus: approved ? "approved" : "denied" }
          : m,
      ),
    );
    setIsProcessing(true);

    const results = [];

    if (approved) {
      // Execute all pending tools
      for (const call of message.toolCalls) {
        const result = await executeTool(call);
        results.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { result },
          },
        });
      }
    } else {
      // Send rejection for all pending tools
      for (const call of message.toolCalls) {
        results.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { result: { error: "User denied action." } },
          },
        });
      }
    }

    // Combine with any safe results that were holding
    const allResults = [...(message.safeResults || []), ...results];

    // Send back to model to resume turn
    try {
      const nextResponse = await chatRef.current.sendMessage({
        message: allResults,
      });
      await processModelResponse(nextResponse);
    } catch (e) {
      console.error("Error resuming chat after action", e);
      setIsProcessing(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatRef.current) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text: textToSend },
    ]);
    setIsProcessing(true);

    try {
      const response = await chatRef.current.sendMessage({
        message: textToSend,
      });
      await processModelResponse(response);
    } catch (e) {
      console.error("Chat Error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "system",
          text: "Error: Connection interrupted.",
        },
      ]);
      setIsProcessing(false);
    }
  };

  const renderToolPreview = (call: any) => {
    const args = call.args;
    switch (call.name) {
      case "addHabit":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-emerald-400">Add Habit</span>
            <span className="text-sm">
              "{args.name}"{" "}
              <span className="text-xs text-muted">({args.category})</span>
            </span>
          </div>
        );
      case "updateHabit":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-amber-400">Update Habit</span>
            <span className="text-sm">Target: "{args.targetName}"</span>
            {args.newName && (
              <span className="text-xs text-muted">
                New Name: {args.newName}
              </span>
            )}
            {args.newCategory && (
              <span className="text-xs text-muted">
                New Cat: {args.newCategory}
              </span>
            )}
            {args.active !== undefined && (
              <span className="text-xs text-muted">
                Active: {args.active.toString()}
              </span>
            )}
          </div>
        );
      case "removeHabit":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-red-400">Remove Habit</span>
            <span className="text-sm">Name: "{args.name}"</span>
          </div>
        );
      case "addObjective":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-emerald-400">Add Objective</span>
            <span className="text-sm">"{args.title}"</span>
            <span className="text-xs text-muted italic">"{args.why}"</span>
          </div>
        );
      case "updateObjective":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-amber-400">Update Objective</span>
            <span className="text-sm">Target: "{args.targetTitle}"</span>
            {args.newTitle && (
              <span className="text-xs text-muted">
                New Title: {args.newTitle}
              </span>
            )}
          </div>
        );
      case "removeObjective":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-red-400">Remove Objective</span>
            <span className="text-sm">Title: "{args.title}"</span>
          </div>
        );
      case "addKeyResult":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-emerald-400">Add Key Result</span>
            <span className="text-sm">
              {args.title}: {args.target}
            </span>
            <span className="text-xs text-muted">
              To: "{args.objectiveTitle}"
            </span>
          </div>
        );
      case "updateKeyResult":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-amber-400">
              Update Key Result
            </span>
            <span className="text-sm">"{args.krTitle}"</span>
            <span className="text-xs text-muted">
              Obj: "{args.objectiveTitle}"
            </span>
            {args.newCurrent && (
              <span className="text-xs text-emerald-300">
                New Progress: {args.newCurrent}
              </span>
            )}
          </div>
        );
      case "removeKeyResult":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-red-400">Remove Key Result</span>
            <span className="text-sm">{args.keyResultTitle}</span>
            <span className="text-xs text-muted">
              From: "{args.objectiveTitle}"
            </span>
          </div>
        );
      case "logDailyCheckIn":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-blue-400">Update Log</span>
            <div className="text-xs text-muted grid grid-cols-2 gap-1">
              {args.mood && <span>Mood: {args.mood}</span>}
              {args.energy && <span>Energy: {args.energy}</span>}
              {args.deepWorkMinutes && (
                <span>Deep Work: {args.deepWorkMinutes}m</span>
              )}
              {args.presenceRep && <span>Presence: Yes</span>}
              {args.win && (
                <span className="col-span-2">
                  Win: {args.win.substring(0, 20)}...
                </span>
              )}
            </div>
          </div>
        );
      case "rememberFact":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-purple-400">Store Memory</span>
            <span className="text-sm">"{args.fact}"</span>
            <span className="text-xs text-muted uppercase tracking-wider">
              {args.category}
            </span>
          </div>
        );
      case "forgetFact":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-red-400">Forget Memory</span>
            <span className="text-sm">ID: {args.memoryId}</span>
          </div>
        );
      case "addCalendarEvent":
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-blue-400">Add to Calendar</span>
            <span className="text-sm font-semibold">{args.title}</span>
            <span className="text-xs text-muted">
              {new Date(args.startTime).toLocaleString()} -{" "}
              {new Date(args.endTime).toLocaleTimeString()}
            </span>
          </div>
        );
      default:
        return <span>Execute {call.name}</span>;
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
            ${
              isOpen
                ? "bg-primary text-glass-surface rotate-90"
                : "bg-glass-surface border border-primary/20 text-primary hover:scale-105"
            }
            backdrop-blur-xl
          `}
        >
          {isOpen ? <X size={24} /> : <Compass size={24} strokeWidth={1.5} />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-40 right-6 md:bottom-32 md:right-12 w-[90vw] md:w-[450px] h-[75vh] z-50 animate-fade-in origin-bottom-right">
          {/* Replaced GlassCard with direct div for better layout control */}
          <div className="glass-panel h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl border-primary/20">
            {/* Header */}
            <div className="flex-none p-4 border-b border-primary/10 bg-primary/5 flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              <h3 className="font-serif font-medium text-primary">Signal</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Text Bubbles */}
                  {msg.text && (
                    <div
                      className={`
                        max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                        ${
                          msg.role === "user"
                            ? "bg-primary/10 text-primary rounded-tr-sm"
                            : msg.role === "system"
                            ? "bg-transparent text-muted font-mono text-xs border border-primary/10 py-1 px-2 mb-2"
                            : "bg-glass-surface border border-primary/5 text-primary rounded-tl-sm"
                        }
                      `}
                    >
                      {msg.role === "system" && (
                        <Terminal size={10} className="inline mr-2" />
                      )}
                      {msg.role === "model" ? (
                        <div className="markdown-content">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => (
                                <p className="mb-2 last:mb-0" {...props} />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul
                                  className="list-disc pl-4 mb-2 space-y-1"
                                  {...props}
                                />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol
                                  className="list-decimal pl-4 mb-2 space-y-1"
                                  {...props}
                                />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="pl-1" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong
                                  className="font-semibold text-emerald-400"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  )}

                  {/* Action Cards (Tools) */}
                  {msg.isActionRequired && msg.toolCalls && (
                    <div className="mt-2 w-[90%] bg-glass-surface border border-primary/10 rounded-xl p-4 shadow-lg animate-fade-in ring-1 ring-primary/5">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/5">
                        <AlertCircle size={16} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Proposed Actions
                        </span>
                      </div>

                      <div className="space-y-3 mb-4 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {msg.toolCalls.map((call, idx) => (
                          <div
                            key={idx}
                            className="bg-primary/5 rounded p-3 text-sm border border-primary/5"
                          >
                            {renderToolPreview(call)}
                          </div>
                        ))}
                      </div>

                      {msg.actionStatus === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActionDecision(msg, true)}
                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} /> Confirm
                          </button>
                          <button
                            onClick={() => handleActionDecision(msg, false)}
                            className="flex-1 bg-primary/5 hover:bg-primary/10 text-muted border border-primary/10 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`text-center text-xs font-bold uppercase tracking-wide py-2 rounded ${
                            msg.actionStatus === "approved"
                              ? "text-emerald-500 bg-emerald-500/5"
                              : "text-red-400 bg-red-500/5"
                          }`}
                        >
                          Action {msg.actionStatus}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUGGESTION CHIPS: Render only for the latest message if present */}
                  {msg.suggestions &&
                    index === messages.length - 1 &&
                    !isProcessing && (
                      <div className="flex flex-wrap gap-2 mt-2 max-w-[90%] self-start animate-fade-in">
                        {msg.suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(s)}
                            className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 
                                     text-xs font-medium text-emerald-400 transition-all hover:scale-105 active:scale-95 text-left shadow-sm"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {/* SUGGESTIONS GRID: Show if no user messages sent yet AND no messages at all from user side */}
              {messages.filter((m) => m.role === "user").length === 0 &&
                !isProcessing && (
                  <div className="grid grid-cols-2 gap-3 mt-4 animate-fade-in px-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s.text)}
                        className="text-left p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all hover:scale-[1.02] group"
                      >
                        <div className="text-xl mb-2 group-hover:scale-110 transition-transform origin-left">
                          {s.icon}
                        </div>
                        <div className="font-medium text-sm text-primary leading-tight">
                          {s.label}
                        </div>
                        <div className="text-[10px] text-muted mt-1 leading-tight">
                          {s.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-glass-surface border border-primary/5 rounded-2xl px-4 py-3 rounded-tl-sm">
                    <Loader2
                      size={16}
                      className="animate-spin text-primary/50"
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-none p-4 border-t border-primary/10 bg-glass-surface/50 backdrop-blur-md">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Reflect, check-in, or ask for help..."
                  className="w-full bg-primary/5 border border-primary/10 rounded-xl pl-4 pr-12 py-3 text-sm text-primary placeholder-primary/30 focus:outline-none focus:border-primary/30 transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isProcessing}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
