import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEMPLATES_FILE = path.join(process.cwd(), 'user_templates.json');

// Helper to read templates
async function readTemplates() {
  try {
    const data = await fs.readFile(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // Return empty array if file doesn't exist
    }
    throw error;
  }
}

// Helper to write templates
async function writeTemplates(templates: any[]) {
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const templates = await readTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Error reading user templates:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const template = await request.json();
    if (!template || !template.templateId) {
      return NextResponse.json({ success: false, error: 'Invalid template data' }, { status: 400 });
    }
    
    // Force category to 'custom' or 'user' for user templates
    template.category = 'custom';
    
    const templates = await readTemplates();
    const existingIndex = templates.findIndex((t: any) => t.templateId === template.templateId);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template; // Update
    } else {
      templates.push(template); // Create
    }
    
    await writeTemplates(templates);
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("Error saving user template:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID required' }, { status: 400 });
    }
    
    const templates = await readTemplates();
    const filtered = templates.filter((t: any) => t.templateId !== id);
    
    await writeTemplates(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user template:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
