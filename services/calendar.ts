import { supabase } from "./supabase";

export interface CalendarEvent {
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  description?: string;
}

export const CalendarService = {
  createEvent: async (
    event: CalendarEvent,
  ): Promise<{ success: boolean; link?: string; error?: string }> => {
    try {
      // 1. Get Session & Provider Token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.provider_token) {
        throw new Error("PERMISSION_MISSING");
      }

      // 2. Call Google Calendar API
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: event.title,
            description: event.description,
            start: { dateTime: event.startTime },
            end: { dateTime: event.endTime },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        // Check for 401/403 specifically to suggest re-login
        if (response.status === 401 || response.status === 403) {
          throw new Error("PERMISSION_MISSING");
        }
        throw new Error(errorData.error?.message || "Failed to create event");
      }

      const data = await response.json();
      return { success: true, link: data.htmlLink };
    } catch (error: any) {
      if (error.message === "PERMISSION_MISSING") {
        return { success: false, error: "PERMISSION_MISSING" };
      }
      return { success: false, error: error.message };
    }
  },

  listEvents: async (
    timeMin: string,
    timeMax: string,
    maxResults: number = 10,
  ): Promise<{ success: boolean; events?: any[]; error?: string }> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !session.provider_token)
        throw new Error("PERMISSION_MISSING");

      const params = new URLSearchParams({
        timeMin,
        timeMax,
        maxResults: maxResults.toString(),
        singleEvents: "true",
        orderBy: "startTime",
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: { Authorization: `Bearer ${session.provider_token}` },
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          throw new Error("PERMISSION_MISSING");
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to list events");
      }

      const data = await response.json();
      return { success: true, events: data.items };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateEvent: async (
    eventId: string,
    event: Partial<CalendarEvent>,
  ): Promise<{ success: boolean; link?: string; error?: string }> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !session.provider_token)
        throw new Error("PERMISSION_MISSING");

      const body: any = {};
      if (event.title) body.summary = event.title;
      if (event.description) body.description = event.description;
      if (event.startTime) body.start = { dateTime: event.startTime };
      if (event.endTime) body.end = { dateTime: event.endTime };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          throw new Error("PERMISSION_MISSING");
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update event");
      }

      const data = await response.json();
      return { success: true, link: data.htmlLink };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteEvent: async (
    eventId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !session.provider_token)
        throw new Error("PERMISSION_MISSING");

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.provider_token}` },
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403)
          throw new Error("PERMISSION_MISSING");
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete event");
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
