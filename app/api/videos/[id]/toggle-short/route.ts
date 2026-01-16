import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await db.getVideoById(id);
    await db.updateVideo(id, { is_short: !video.is_short });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling short:', error);
    return NextResponse.json(
      { error: 'Failed to toggle short' },
      { status: 500 }
    );
  }
}
