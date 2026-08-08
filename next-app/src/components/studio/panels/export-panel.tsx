"use client";

import React from "react";
import { StudioProject } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileJson, FileText, Table, FileCode } from "lucide-react";
import { toast } from "sonner";

interface ExportPanelProps {
  project: StudioProject;
}

export default function ExportPanel({ project }: ExportPanelProps) {
  const handleExport = async (format: "md" | "txt" | "json" | "docx" | "pdf" | "csv" | "html") => {
    if (format === "pdf") {
      try {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        let y = 20;
        
        doc.setFontSize(16);
        doc.text(`Production Package: ${project.title || "Untitled"}`, 20, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        
        if (prod.titles && prod.titles.length > 0) {
          doc.setFontSize(14);
          doc.text("Titles", 20, y);
          y += 8;
          doc.setFontSize(11);
          prod.titles.forEach(t => {
            doc.text(`• ${t.title} (SEO: ${t.seoScore})`, 25, y);
            y += 6;
            if (y > 280) { doc.addPage(); y = 20; }
          });
          y += 10;
        }

        if (prod.thumbnails && prod.thumbnails.length > 0) {
          doc.setFontSize(14);
          doc.text("Thumbnails", 20, y);
          y += 8;
          doc.setFontSize(11);
          prod.thumbnails.forEach(t => {
            doc.text(`Concept: ${t.title}`, 20, y);
            y += 6;
            doc.text(`• Hook: ${t.visualHook}`, 25, y);
            y += 6;
            doc.text(`• Subject: ${t.mainSubject}`, 25, y);
            y += 6;
            if (t.imagePrompt) {
              const lines = doc.splitTextToSize(`• Prompt: ${t.imagePrompt}`, 170);
              doc.text(lines, 25, y);
              y += (lines.length * 5) + 2;
            }
            y += 4;
            if (y > 270) { doc.addPage(); y = 20; }
          });
        }

        if (project.sections && project.sections.length > 0) {
          doc.addPage();
          y = 20;
          doc.setFontSize(14);
          doc.text("Storyboard Scenes", 20, y);
          y += 8;
          doc.setFontSize(10);
          project.sections.forEach(s => {
            doc.text(`Scene: ${s.type || "N/A"}`, 20, y);
            y += 5;
            doc.text(`Title: ${s.title || "Untitled"}`, 25, y);
            y += 5;
            const contentLines = doc.splitTextToSize(`Content: ${s.content}`, 170);
            doc.text(contentLines, 25, y);
            y += (contentLines.length * 4) + 2;
            
            if (s.visualNotes) {
                const visualLines = doc.splitTextToSize(`Visual: ${s.visualNotes}`, 170);
                doc.text(visualLines, 25, y);
                y += (visualLines.length * 4) + 2;
            }
            if (y > 270) { doc.addPage(); y = 20; }
          });
        }

        doc.save(`${project.title?.replace(/\s+/g, '_') || 'project'}_full.pdf`);
        toast.success("Exported as PDF");
        return;
      } catch (err) {
        console.error(err);
        toast.error("Failed to export PDF");
        return;
      }
    }

    if (format === "docx") {
      try {
        const docx = await import("docx");
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        
        const docChildren: any[] = [
          new Paragraph({ text: `Production Package: ${project.title || "Untitled"}`, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleDateString()}`, spacing: { after: 800 } })
        ];

        if (prod.titles && prod.titles.length > 0) {
          docChildren.push(new Paragraph({ text: "Titles", heading: HeadingLevel.HEADING_1 }));
          prod.titles.forEach(t => {
             docChildren.push(new Paragraph({ text: `${t.title} (SEO: ${t.seoScore}, Click: ${t.clickPotential})`, bullet: { level: 0 } }));
          });
          docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));
        }

        if (prod.description) {
           docChildren.push(new Paragraph({ text: "Description", heading: HeadingLevel.HEADING_1 }));
           docChildren.push(new Paragraph({ text: prod.description.full || "", spacing: { after: 400 } }));
        }

        if (prod.thumbnails && prod.thumbnails.length > 0) {
           docChildren.push(new Paragraph({ text: "Thumbnails", heading: HeadingLevel.HEADING_1 }));
           prod.thumbnails.forEach(t => {
             docChildren.push(new Paragraph({ text: `Concept: ${t.title}`, heading: HeadingLevel.HEADING_2 }));
             docChildren.push(new Paragraph({ text: `Hook: ${t.visualHook}`, bullet: { level: 0 } }));
             docChildren.push(new Paragraph({ text: `Subject: ${t.mainSubject}`, bullet: { level: 0 } }));
             if (t.imagePrompt) {
               docChildren.push(new Paragraph({ text: `AI Image Prompt: ${t.imagePrompt}`, bullet: { level: 0 } }));
             }
             docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
           });
        }

        if (project.sections && project.sections.length > 0) {
            docChildren.push(new Paragraph({ text: "Storyboard Scenes", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
            project.sections.forEach(s => {
                docChildren.push(new Paragraph({ text: `Scene: ${s.type || "N/A"} - ${s.title || "Untitled"}`, heading: HeadingLevel.HEADING_2 }));
                docChildren.push(new Paragraph({ text: `Script Chunk: ${s.content}`, bullet: { level: 0 } }));
                if (s.visualNotes) docChildren.push(new Paragraph({ text: `Visuals: ${s.visualNotes}`, bullet: { level: 0 } }));
                if (s.cameraAngle) docChildren.push(new Paragraph({ text: `Camera: ${s.cameraAngle}`, bullet: { level: 0 } }));
                if (s.brollSuggestions) docChildren.push(new Paragraph({ text: `B-Roll: ${s.brollSuggestions.join(", ")}`, bullet: { level: 0 } }));
                docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
            });
        }

        const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title?.replace(/\s+/g, '_') || 'project'}_full.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Exported as DOCX");
        return;
      } catch (err) {
        console.error(err);
        toast.error("Failed to export DOCX");
        return;
      }
    }

    let data = "";
    if (format === "json") {
      data = JSON.stringify(project.production || {}, null, 2);
    } else if (format === "md" || format === "txt") {
      const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
      const lines: string[] = [];
      lines.push(`# Production Package: ${project.title}`);
      lines.push("");
      
      lines.push("## Titles");
      prod.titles?.forEach(t => lines.push(`- ${t.title} (SEO: ${t.seoScore}, Click: ${t.clickPotential})`));
      lines.push("");

      if (prod.description) {
        lines.push("## Description");
        lines.push(prod.description.full);
        lines.push("");
      }

      if (prod.thumbnails && prod.thumbnails.length > 0) {
        lines.push("## Thumbnails");
        prod.thumbnails.forEach(t => {
          lines.push(`### Concept: ${t.title}`);
          lines.push(`- Hook: ${t.visualHook}`);
          lines.push(`- Subject: ${t.mainSubject}`);
          if (t.imagePrompt) {
            lines.push(`- AI Image Prompt: ${t.imagePrompt}`);
            lines.push(`- Negative Prompt: ${t.negativePrompt || "N/A"}`);
            lines.push(`- Style: ${t.style || "N/A"}`);
            lines.push(`- Aspect Ratio: ${t.aspectRatio || "16:9"}`);
            lines.push(`- Preview URL: ${t.generatedImageUrl || "Not generated"}`);
          }
          if (t.readinessScore) {
            lines.push(`- Readiness Score: ${t.readinessScore.overallScore}/100`);
          }
          lines.push("");
        });
      }
      if (project.sections && project.sections.length > 0) {
        lines.push("## Storyboard Scenes");
        project.sections.forEach(s => {
            lines.push(`### ${s.type || "Scene"} - ${s.title || "Untitled"}`);
            lines.push(`**Script Chunk:** ${s.content}`);
            if (s.visualNotes) lines.push(`**Visuals:** ${s.visualNotes}`);
            if (s.cameraAngle) lines.push(`**Camera:** ${s.cameraAngle}`);
            if (s.brollSuggestions) lines.push(`**B-Roll:** ${s.brollSuggestions.join(", ")}`);
            lines.push("");
        });
      }
      data = lines.join("\n");
    } else if (format === "csv") {
      const headers = ["Scene Type", "Title", "Script Chunk", "Visuals", "Camera", "B-Roll"];
      const rows = (project.sections || []).map(s => {
        return [
          s.type || "",
          s.title || "",
          (s.content || "").replace(/"/g, '""'),
          (s.visualNotes || "").replace(/"/g, '""'),
          (s.cameraAngle || "").replace(/"/g, '""'),
          (s.brollSuggestions || []).join(", ").replace(/"/g, '""')
        ].map(cell => `"${cell}"`).join(",");
      });
      data = [headers.join(","), ...rows].join("\n");
    } else if (format === "html") {
      data = `
<!DOCTYPE html>
<html>
<head>
<title>${project.title || "Project"}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
  h1, h2, h3 { color: #333; }
  .scene { border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
</style>
</head>
<body>
  <h1>${project.title || "Project"}</h1>
  <h2>Production Package</h2>
  <div>${project.production?.description?.full || ""}</div>
  <h2>Storyboard Scenes</h2>
  ${(project.sections || []).map(s => `
    <div class="scene">
      <h3>${s.type || "Scene"} - ${s.title || "Untitled"}</h3>
      <p><strong>Script:</strong> ${s.content}</p>
      <p><strong>Visuals:</strong> ${s.visualNotes}</p>
      <p><strong>Camera:</strong> ${s.cameraAngle}</p>
    </div>
  `).join("")}
</body>
</html>
      `.trim();
    }

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_full.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported as .${format}`);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card shadow-sm shrink-0">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><Download className="w-5 h-5 text-primary"/> Export Center</h2>
          <p className="text-sm text-muted-foreground mt-1">Download your script, storyboard, and production assets.</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 md:p-8 bg-muted/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all group" onClick={() => handleExport("md")}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Markdown Package</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Ideal for Notion & Obsidian</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-muted-foreground/40 transition-all group" onClick={() => handleExport("txt")}>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Plain Text</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Simple text document</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all group" onClick={() => handleExport("json")}>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileJson className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Raw JSON</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">For developers & APIs</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all group" onClick={() => handleExport("docx")}>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Microsoft Word</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Standard DOCX format</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-red-500/40 transition-all group" onClick={() => handleExport("pdf")}>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">PDF Document</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Standard PDF format</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-green-500/40 transition-all group" onClick={() => handleExport("csv")}>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Table className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">CSV Spreadsheet</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">For Excel & Google Sheets</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-orange-500/40 transition-all group" onClick={() => handleExport("html")}>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileCode className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">HTML Page</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Viewable in any browser</span>
              </div>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

