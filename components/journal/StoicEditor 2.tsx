import React, { useState, useEffect, useRef } from "react";

interface StoicEditorProps {
  onSave: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  initialContent?: string;
}

export const StoicEditor: React.FC<StoicEditorProps> = ({
  onSave,
  onFocus,
  onBlur,
  placeholder = "Reflect here...",
  initialContent = "",
}) => {
  const [content, setContent] = useState(initialContent);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleSave = () => {
    if (elapsed < 120 && !showNudge && content.length > 10) {
      setShowNudge(true);
      return;
    }
    onSave(content);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full max-w-xl animate-fade-in mt-12 relative group">
      {/* Subtle Timer */}
      <div className="absolute -top-8 right-0 text-white/10 text-xs font-stoic tracking-widest pointer-events-none group-hover:text-white/20 transition-colors">
        {formatTime(elapsed)}
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (showNudge) setShowNudge(false);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full bg-transparent text-white/90 placeholder-white/20 text-lg md:text-xl font-stoic leading-relaxed resize-none focus:outline-none min-h-[120px] tracking-wide"
        spellCheck={false}
      />

      <div
        className={`transition-all duration-700 ease-in-out flex flex-col items-center mt-8 ${
          content.length > 0
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {showNudge && (
          <div className="mb-4 text-white/40 text-xs font-stoic italic animate-fade-in">
            Dig a little deeper? Great thinking takes time.
          </div>
        )}
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 transition-all font-stoic text-sm tracking-widest uppercase"
        >
          {showNudge ? "Complete Anyway" : "Complete Reflection"}
        </button>
      </div>
    </div>
  );
};
