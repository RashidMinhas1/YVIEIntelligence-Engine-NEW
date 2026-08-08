/**
 * API Route: /api/providers/backup
 * Manual Export & Restore endpoint for Universal AI Provider Ecosystem V2.
 */

import { NextResponse } from 'next/server';
import { backupService } from '@/lib/backup/backupService';

export async function GET() {
  try {
    const backup = await backupService.createBackup('manual_export');
    return NextResponse.json({ success: true, backup });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Export failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const backupData = await req.json();
    const success = await backupService.restoreFromBackup(backupData);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Restore failed' }, { status: 500 });
  }
}
