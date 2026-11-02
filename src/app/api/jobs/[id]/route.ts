import { NextResponse } from 'next/server';
import type { ProductJob } from '@/lib/product-pipeline';

const jobs = globalThis as typeof globalThis & { __hfJobs?: Map<string, ProductJob> };
function getJobs() {
  jobs.__hfJobs ??= new Map<string, ProductJob>();
  return jobs.__hfJobs;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJobs().get(id);
  if (!job) return NextResponse.json({ error: 'Không tìm thấy job.' }, { status: 404 });
  return NextResponse.json({ job });
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const job = getJobs().get(id);
  if (!job) return NextResponse.json({ error: 'Không tìm thấy job.' }, { status: 404 });
  job.stage = 'rendering';
  job.message = 'Đã đưa các biến thể vào hàng đợi render. Bản production sẽ chạy worker bền vững ở bước triển khai tiếp theo.';
  getJobs().set(id, job);
  return NextResponse.json({ job });
}
