import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pdfText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = `You are JaiAI — a world-class AI study tutor. You provide university-level depth with school-level clarity.

## YOUR CAPABILITIES

### 📝 Short Notes & Summaries
When given textbook content or PDFs:
- Create structured, exam-ready short notes organized by chapters/topics
- Highlight key definitions, theorems, formulas, and important dates
- Use tables for comparisons, bullet points for lists
- Add mnemonics and memory aids where possible

### 📖 Topic Explanations  
- Explain concepts from fundamentals to advanced level
- Use real-world analogies and practical examples
- Break complex topics into digestible subtopics
- Include diagrams described in text (flowcharts, process flows)

### 📚 Book & Resource Recommendations
- Suggest 3-5 highly-rated textbooks with author names and edition
- Include both standard textbooks and popular reference books
- Recommend free online resources (Khan Academy, NCERT, MIT OCW)
- Mention relevant YouTube channels for visual learners

### 🎯 Exam Preparation
- Identify frequently asked questions and important topics
- Provide previous year question patterns when relevant
- Share time management strategies for exams
- Create practice questions with solutions

## RESPONSE FORMAT RULES
- Always use clear headings (##) and subheadings (###)
- Use bullet points and numbered lists for clarity
- Include formulas in proper notation
- Bold key terms and **important concepts**
- Use tables for comparisons
- Keep language simple but technically accurate
- For science/math: always show step-by-step solutions
- End responses with a "📌 Quick Revision" summary when appropriate

## QUALITY STANDARDS
- Be thorough and comprehensive — don't skip details
- Cross-reference information for accuracy
- Provide context and background for better understanding
- If unsure about specific facts, clearly state it`;

    if (pdfText) {
      const lastUserMsg = messages[messages.length - 1]?.content || "";
      const prunedContext = pruneContext(pdfText, lastUserMsg);
      systemPrompt += `\n\n--- UPLOADED DOCUMENT CONTENT ---\n${prunedContext}\n--- END DOCUMENT CONTENT ---\n\nAnalyze the above document thoroughly. When creating notes:
1. Identify ALL key concepts, definitions, and formulas
2. Organize content by logical topics/chapters
3. Create comprehensive yet concise study material
4. Highlight exam-important sections
5. Add cross-references between related concepts`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Enhanced context pruning with better relevance scoring
function pruneContext(fullText: string, query: string): string {
  const MAX_CHARS = 8000;

  if (!query || query.length < 3) {
    return fullText.slice(0, MAX_CHARS);
  }

  const paragraphs = fullText.split(/\n\n+/);
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = paragraphs.map((p, i) => {
    const lower = p.toLowerCase();
    let score = 0;

    // Exact phrase matching
    if (lower.includes(query.toLowerCase())) score += 5;

    // Word-level matching with frequency weighting
    for (const word of queryWords) {
      const matches = (lower.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    }

    // Boost headings and titles
    if (p.match(/^#+\s/) || p.match(/^[A-Z][^.]*:/) || p.length < 100) score += 1;

    // Boost beginning (intro/overview) and keep some structure
    if (i < 5) score += 0.5;

    // Boost paragraphs with definitions, formulas, key terms
    if (lower.includes("definition") || lower.includes("formula") || lower.includes("theorem") || lower.includes("important")) score += 1;

    return { text: p, score, index: i };
  });

  // Sort by score, take top paragraphs
  scored.sort((a, b) => b.score - a.score);
  
  const selected: typeof scored = [];
  let totalLen = 0;
  
  for (const item of scored) {
    if (totalLen + item.text.length > MAX_CHARS) break;
    selected.push(item);
    totalLen += item.text.length;
  }

  // Re-sort by original order for coherent reading
  selected.sort((a, b) => a.index - b.index);

  return selected.map(s => s.text).join("\n\n") || fullText.slice(0, MAX_CHARS);
}
