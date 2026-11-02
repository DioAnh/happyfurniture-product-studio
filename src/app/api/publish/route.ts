import { NextResponse } from 'next/server';
import { publishProductFamily } from '@/lib/publisher';
import { validateBrief } from '@/lib/product-pipeline';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBrief(body);
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
    const publication = await publishProductFamily({ ...result.brief, typeCode: body.typeCode, designCode: body.designCode, baseSku: body.baseSku, rooms: body.rooms, imageUrls: body.imageUrls });
    return NextResponse.json({ publication, liveEnabled: publication.mode === 'live' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể chuẩn bị publish.' }, { status: 400 });
  }
}
