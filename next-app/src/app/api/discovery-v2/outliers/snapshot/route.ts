import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SNAPSHOTS_FILE = path.join(process.cwd(), 'data', 'snapshots.json');
const MAX_SNAPSHOTS = 100;

async function readSnapshots(): Promise<any[]> {
  try {
    await fs.mkdir(path.dirname(SNAPSHOTS_FILE), { recursive: true });
    const content = await fs.readFile(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeSnapshots(snapshots: any[]): Promise<void> {
  await fs.mkdir(path.dirname(SNAPSHOTS_FILE), { recursive: true });
  await fs.writeFile(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2), 'utf-8');
}

/** GET – List all snapshots or load a specific one */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const videoId = searchParams.get('videoId');

    const snapshots = await readSnapshots();

    // Load specific snapshot by ID
    if (id) {
      const snapshot = snapshots.find(s => s.id === id);
      if (!snapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json({ snapshot });
    }

    // Filter by videoId
    if (videoId) {
      const filtered = snapshots.filter(s => s.selectedVideo?.videoId === videoId);
      return NextResponse.json({
        snapshots: filtered.map(s => ({
          id: s.id,
          projectName: s.projectName,
          videoTitle: s.selectedVideo?.title,
          channelTitle: s.selectedVideo?.channelTitle,
          timestamp: s.timestamp,
          aiModelUsed: s.aiModelUsed,
          totalEntries: s.timelineResult?.entries?.length || s.timelineResult?.lifecycleTimeline?.length || 0
        }))
      });
    }

    // Return all snapshots (summary only)
    return NextResponse.json({
      snapshots: snapshots.map(s => ({
        id: s.id,
        projectName: s.projectName,
        videoTitle: s.selectedVideo?.title,
        channelTitle: s.selectedVideo?.channelTitle,
        thumbnail: s.selectedVideo?.thumbnail,
        timestamp: s.timestamp,
        aiModelUsed: s.aiModelUsed,
        totalEntries: s.timelineResult?.entries?.length || s.timelineResult?.lifecycleTimeline?.length || 0
      }))
    });
  } catch (error: any) {
    console.error('[Snapshot GET Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to load snapshots' }, { status: 500 });
  }
}

/** POST – Save a new research session snapshot */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, selectedVideo, channelInfo, appliedFilters, timelineResult, aiModelUsed } = body;

    if (!selectedVideo || !timelineResult) {
      return NextResponse.json({ error: 'Missing required fields: selectedVideo, timelineResult' }, { status: 400 });
    }

    const videoId = selectedVideo.videoId || selectedVideo.id || 'unknown';
    const timestamp = new Date().toISOString();
    const id = `snapshot-${videoId}-${Date.now()}`;

    const snapshot = {
      id,
      projectName: projectName || 'Untitled Research',
      selectedVideo: {
        videoId,
        title: selectedVideo.title || '',
        channelTitle: selectedVideo.channelTitle || '',
        viewCount: selectedVideo.viewCount || '0',
        publishedAt: selectedVideo.publishedAt || '',
        thumbnail: selectedVideo.thumbnail || ''
      },
      channelInfo: channelInfo || {
        channelId: selectedVideo.channelId || '',
        channelTitle: selectedVideo.channelTitle || '',
        subscriberCount: '0'
      },
      appliedFilters: appliedFilters || {
        similarityThreshold: 0.70,
        searchLimit: 200,
        performanceFilter: 'all',
        sortBy: 'date'
      },
      timelineResult,
      timestamp,
      aiModelUsed: aiModelUsed || 'Unknown',
      version: 1
    };

    const snapshots = await readSnapshots();
    snapshots.unshift(snapshot);

    // Enforce max limit
    const trimmed = snapshots.slice(0, MAX_SNAPSHOTS);
    await writeSnapshots(trimmed);

    return NextResponse.json({ id, timestamp, message: 'Snapshot saved successfully' });
  } catch (error: any) {
    console.error('[Snapshot POST Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to save snapshot' }, { status: 500 });
  }
}

/** DELETE – Remove a specific snapshot */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing snapshot ID' }, { status: 400 });
    }

    const snapshots = await readSnapshots();
    const filtered = snapshots.filter(s => s.id !== id);

    if (filtered.length === snapshots.length) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    await writeSnapshots(filtered);
    return NextResponse.json({ message: 'Snapshot deleted successfully' });
  } catch (error: any) {
    console.error('[Snapshot DELETE Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete snapshot' }, { status: 500 });
  }
}
