import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function repairTruncatedJson(str: string): any | null {
  try {
    return JSON.parse(str);
  } catch (e) {
    let repaired = str.trim();
    
    for (let i = 0; i < 1500; i++) {
      if (repaired.length < 10) return null;
      
      const tests = [
        repaired + "}]}",
        repaired + "]}",
        repaired + "\"]}",
        repaired + "\"}]}",
        repaired + "}\"]}",
        repaired + "}}]}",
        repaired + "}"
      ];
      
      for (let test of tests) {
        try {
          return JSON.parse(test);
        } catch (err) {}
      }
      
      repaired = repaired.slice(0, -1);
    }
    return null;
  }
}

export function splitScriptIntoSentences(text: string): string[] {
  if (!text) return [];

  const abbreviations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "vs.", "etc.", "i.e.", "e.g.", "U.S.", "U.K.", "St.", "Inc.", "Ltd.", "Capt.", "Col.", "Gen."];
  
  let processed = text;

  // Protect abbreviations
  abbreviations.forEach((abbr, i) => {
    const escaped = abbr.replace(/\./g, "\\.");
    const regex = new RegExp(`\\b${escaped}`, "gi");
    processed = processed.replace(regex, `__ABBR_${i}__`);
  });

  // Protect decimals
  processed = processed.replace(/(\d)\.(\d)/g, "$1__DECIMAL__$2");

  // Step 1: Split at standard sentence boundaries (. ? !)
  processed = processed.replace(/([.?!])\s+(?=[A-Z0-9"'])/g, "$1|SPLIT|");
  
  // Step 2: Split at newlines
  processed = processed.replace(/\n+/g, "|SPLIT|");

  // Step 3: Professional Cinematic Beat Splitting (Netflix/Documentary style)
  // Break on transitional phrases and conjunctions where a visual change naturally occurs.
  // We use lookbehinds and lookaheads to safely split before these words if they are preceded by a comma or space.
  const visualBeats = ["But", "And", "Until", "Then", "Because", "However", "Yet", "Suddenly"];
  
  visualBeats.forEach(beat => {
    // Split before the beat word if it follows a comma and space, or just a space (and is capitalized in the middle of a sentence, or we force it if it's a dramatic pause)
    // To be safe and not over-split, we'll split if there's a comma followed by the beat.
    const regexComma = new RegExp(`,\\s+(${beat}\\b)`, "gi");
    processed = processed.replace(regexComma, ",|SPLIT|$1");
    
    // Also split before "Until" or "Then" if it's a clear new idea (often capitalized or after a pause)
    const regexSpace = new RegExp(`\\s+(${beat}\\b)`, "g"); // Case sensitive for capitalized beats in the middle
    processed = processed.replace(regexSpace, " |SPLIT|$1");
  });

  // Clean up any double splits
  processed = processed.replace(/\|SPLIT\|\s*\|SPLIT\|/g, "|SPLIT|");

  let sentences = processed.split("|SPLIT|");
  
  return sentences.map(s => {
    let restored = s;
    abbreviations.forEach((abbr, i) => {
      restored = restored.replace(new RegExp(`__ABBR_${i}__`, "g"), abbr);
    });
    restored = restored.replace(/__DECIMAL__/g, ".");
    return restored.trim();
  }).filter(s => s.length > 5); // Ignore extremely short fragments
}

export function splitScriptIntoParagraphs(text: string): string[] {
  if (!text) return [];
  // Split by double newline or single newline, but prioritize larger chunks
  let paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length <= 1) {
    paragraphs = text.split(/\n/);
  }
  return paragraphs.map(p => p.trim()).filter(p => p.length > 20); // Filter out tiny fragments or empty lines
}


export const calculateDuration = (text: string, currentWpm: number) => {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return text.trim() === '' ? 0 : Math.ceil((words / currentWpm) * 60);
};

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};
