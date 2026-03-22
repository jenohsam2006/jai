import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, ChatInput, WelcomeScreen, ChatSidebar } from "@/components";
import { sendChatMessage, extractPdfText, type ChatMessage as ChatMsg } from "@/lib/chat-api";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import type { Message } from "@/components/ChatMessage";
import {
  getConversation,
  saveConversation,
  generateTitle,
  type StoredConversation,
} from "@/lib/conversation-store";
import logo from "@/assets/jaiai-logo.png";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfContext, setPdfContext] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Persist conversation after every assistant message
  const persistConversation = useCallback(
    (msgs: Message[], pdf: string, id: string) => {
      const convo: StoredConversation = {
        id,
        title: generateTitle(msgs),
        messages: msgs,
        pdfContext: pdf,
        updatedAt: Date.now(),
      };
      saveConversation(convo);
      setRefreshKey((k) => k + 1);
    },
    []
  );

  const handleSend = async (text: string, file?: File) => {
    let pdfName: string | undefined;
    let currentPdfText = pdfContext;

    if (file) {
      pdfName = file.name;
      toast.info("Extracting text from PDF...");
      try {
        const extracted = await extractPdfText(file);
        currentPdfText = extracted;
        setPdfContext(extracted);
        toast.success("PDF processed successfully!");
      } catch {
        toast.error("Failed to process PDF. Please try again.");
        return;
      }
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || "Please create short notes from this PDF.",
      pdfName,
    };

    const activeId = conversationId ?? crypto.randomUUID();
    if (!conversationId) setConversationId(activeId);

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const chatHistory: ChatMsg[] = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantText = "";
    const assistantId = crypto.randomUUID();

    try {
      await sendChatMessage({
        messages: chatHistory,
        pdfText: currentPdfText || undefined,
        onDelta: (chunk) => {
          assistantText += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantId) {
              return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m));
            }
            return [...prev, { id: assistantId, role: "assistant", content: assistantText }];
          });
        },
        onDone: () => {
          setIsLoading(false);
          setMessages((prev) => {
            persistConversation(prev, currentPdfText, activeId);
            return prev;
          });
        },
      });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setPdfContext("");
    setConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    const convo = getConversation(id);
    if (!convo) return;
    setMessages(convo.messages);
    setPdfContext(convo.pdfContext);
    setConversationId(id);
  };

  return (
    <div className="flex h-screen bg-background dark">
      <ChatSidebar
        currentId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        refreshKey={refreshKey}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/50 px-5 py-3 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <img src={logo} alt="JaiAI" className="w-9 h-9 rounded-xl" />
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground">JaiAI</h2>
              <p className="text-[11px] text-muted-foreground">AI Study Companion</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              + New Chat
            </button>
          )}
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="max-w-3xl mx-auto pb-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 px-5 py-5">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-primary text-xs animate-pulse">●</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;
