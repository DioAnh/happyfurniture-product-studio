import { NextResponse } from 'next/server';
import { renderVariant } from '@/lib/render-service';
import { validateBrief } from '@/lib/product-pipeline';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBrief(body);
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
    const size = result.brief.sizes.find((item) => item.name === body.sizeName) ?? result.brief.sizes[0];
    const materialCode = String(body.materialCode || result.brief.materials[0]).toUpperCase();
    if (!result.brief.materials.includes(materialCode)) return NextResponse.json({ error: 'Mã vật liệu không nằm trong brief.' }, { status: 422 });
    const baseSku = String(body.baseSku || `HF-MOD-${Date.now().toString().slice(-2)}`).toUpperCase();
    const asset = await renderVariant(result.brief, size, materialCode, baseSku);
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Render thất bại.' }, { status: 500 });
  }
}
