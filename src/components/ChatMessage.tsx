import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, User, FileText } from "lucide-react";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pdfName?: string;
};

export const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 px-5 py-5 ${isUser ? "" : "bg-chat-ai/50"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? "bg-muted text-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        {message.pdfName && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 rounded-md bg-muted/50 text-muted-foreground text-xs font-medium border border-border/50">
            <FileText className="w-3 h-3" />
            {message.pdfName}
          </div>
        )}
        <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};
