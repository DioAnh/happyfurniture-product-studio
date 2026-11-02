import { NextResponse } from 'next/server';
import { DEFAULT_MATERIALS } from '@/lib/product-pipeline';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('materials').select('code,name').limit(100);
    if (error) throw error;
    const codes = Array.from(new Set((data ?? []).map((item) => item.code).filter((code) => /^BT\d+$/i.test(code)).map((code) => code.toUpperCase())));
    return NextResponse.json({ materials: codes.length ? codes : DEFAULT_MATERIALS, source: 'supabase-materials' });
  } catch {
    return NextResponse.json({ materials: DEFAULT_MATERIALS, source: 'known-catalog' });
  }
}
