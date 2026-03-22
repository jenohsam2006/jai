import { useState, useRef, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { ArrowUp, Paperclip, Loader2 } from "lucide-react";

type ChatInputProps = {
  onSend: (message: string, file?: File) => void;
  isLoading: boolean;
};

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() && !file) return;
    onSend(input.trim(), file || undefined);
    setInput("");
    setFile(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      if (f.size > 20 * 1024 * 1024) {
        toast.error("PDF must be under 20MB.");
        return;
      }
      setFile(f);
    }
  };

  const canSend = (input.trim() || file) && !isLoading;

  return (
    <div className="px-4 py-4 bg-background">
      <div className="max-w-3xl mx-auto">
        {file && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-muted/50 border border-border/50 px-3 py-1.5 text-xs text-muted-foreground">
            📄 {file.name}
            <button onClick={() => setFile(null)} className="hover:text-foreground ml-1 text-muted-foreground/60">✕</button>
          </div>
        )}
        <div className="relative flex items-end rounded-2xl border border-border/60 bg-card shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="flex-shrink-0 p-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            onClick={() => fileRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any topic, upload a PDF..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-1 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[44px] max-h-[160px]"
            style={{ height: "auto", overflow: "hidden" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 160) + "px";
            }}
          />
          <button
            className={`flex-shrink-0 m-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={!canSend}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          JaiAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};
