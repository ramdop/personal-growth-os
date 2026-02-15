import React from "react";

interface StoicCardProps {
  type: "prompt" | "quote";
  content: string;
  author?: string; // Only for quotes
  date?: string; // Only for prompts
}

export const StoicCard: React.FC<StoicCardProps> = ({
  type,
  content,
  author,
  date,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in">
      {date && (
        <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-stoic">
          {date}
        </span>
      )}

      <h2
        className={`text-2xl md:text-3xl lg:text-4xl text-white leading-relaxed ${
          type === "quote" ? "italic opacity-90" : "font-normal"
        }`}
      >
        {type === "quote" ? `“${content}”` : content}
      </h2>

      {author && <div className="w-12 h-px bg-white/20 my-4" />}

      {author && (
        <span className="text-sm font-stoic text-white/60 tracking-wider">
          ― {author}
        </span>
      )}
    </div>
  );
};
