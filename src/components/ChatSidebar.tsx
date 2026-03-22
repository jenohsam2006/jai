import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversations, deleteConversation, type StoredConversation } from "@/lib/conversation-store";
import logo from "@/assets/jaiai-logo.png";

type Props = {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
  refreshKey: number;
};

export const ChatSidebar = ({ currentId, onSelect, onNewChat, open, onClose, refreshKey }: Props) => {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);

  useEffect(() => {
    setConversations(getConversations());
  }, [currentId, refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    if (currentId === id) onNewChat();
    setConversations(getConversations());
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed md:relative z-40 top-0 left-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo + header */}
        <div className="flex items-center gap-2.5 p-3 border-b border-sidebar-border">
          <img src={logo} alt="JaiAI" className="w-8 h-8 rounded-lg" />
          <span className="font-heading font-semibold text-sm text-sidebar-foreground flex-1">JaiAI</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground" onClick={onNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden text-sidebar-foreground" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors group",
                  currentId === c.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
                <Trash2
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0"
                  onClick={(e) => handleDelete(e, c.id)}
                />
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
