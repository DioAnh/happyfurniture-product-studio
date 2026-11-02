import { NextResponse } from 'next/server';
import { countVariants, validateBrief, type ProductJob } from '@/lib/product-pipeline';

const jobs = globalThis as typeof globalThis & { __hfJobs?: Map<string, ProductJob> };
function getJobs() {
  jobs.__hfJobs ??= new Map<string, ProductJob>();
  return jobs.__hfJobs;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = validateBrief(body);
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
    const id = `job_${Date.now().toString(36)}`;
    const job: ProductJob = {
      id,
      createdAt: new Date().toISOString(),
      stage: 'master_preview',
      brief: result.brief,
      variantCount: countVariants(result.brief),
      completedCount: 0,
      failedCount: 0,
      message: 'Đã nhận brief. Bước tiếp theo là tạo master preview cho từng size.',
    };
    getJobs().set(id, job);
    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: 'Không thể tạo product job.' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ jobs: Array.from(getJobs().values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}
