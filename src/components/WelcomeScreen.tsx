import { motion } from "framer-motion";
import { FileText, Lightbulb, Search, Sparkles } from "lucide-react";
import logo from "@/assets/jaiai-logo.png";

const features = [
  { icon: FileText, title: "Upload PDF", desc: "Extract detailed notes from any textbook or document" },
  { icon: Search, title: "Ask Anything", desc: "Get clear explanations with book references" },
  { icon: Lightbulb, title: "Smart Analysis", desc: "Deep analysis with real-world examples" },
  { icon: Sparkles, title: "Study Material", desc: "AI-crafted notes, summaries & tips" },
];

export const WelcomeScreen = () => (
  <div className="flex flex-1 items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center max-w-xl"
    >
      <motion.img
        src={logo}
        alt="JaiAI"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mx-auto mb-4 w-20 h-20 rounded-2xl"
      />
      <h1 className="text-4xl font-bold font-heading mb-3 text-foreground">
        JaiAI
      </h1>
      <p className="text-muted-foreground mb-10 text-base">
        Your AI-powered study companion. Upload PDFs, ask questions, get comprehensive notes.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-xl border border-border/50 bg-card/50 p-4 text-left hover:border-primary/30 hover:bg-card transition-all duration-200 group cursor-default"
          >
            <f.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-sm text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </div>
);
