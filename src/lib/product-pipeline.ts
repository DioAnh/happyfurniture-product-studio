export type ProductSize = { name: string; widthMm: number; depthMm: number; heightMm: number };
export type ProductBrief = {
  name: string;
  description: string;
  notes: string;
  sizes: ProductSize[];
  materials: string[];
  priceFormula: string;
};

export type PipelineStage = 'draft' | 'master_preview' | 'approved' | 'rendering' | 'validated' | 'published';

export type ProductJob = {
  id: string;
  createdAt: string;
  stage: PipelineStage;
  brief: ProductBrief;
  variantCount: number;
  completedCount: number;
  failedCount: number;
  message: string;
};

export const DEFAULT_MATERIALS = ['BT180', 'BT178', 'BT131', 'BT123', 'BT120', 'BT26', 'BT56', 'BT58'];

export function validateBrief(input: unknown): { ok: true; brief: ProductBrief } | { ok: false; errors: string[] } {
  if (!input || typeof input !== 'object') return { ok: false, errors: ['Brief không hợp lệ.'] };
  const raw = input as Partial<ProductBrief>;
  const errors: string[] = [];
  const name = String(raw.name ?? '').trim();
  const description = String(raw.description ?? '').trim();
  const notes = String(raw.notes ?? '').trim();
  const priceFormula = String(raw.priceFormula ?? '').trim();
  const materials = Array.isArray(raw.materials) ? raw.materials.map(String).filter(Boolean) : [];
  const sizes = Array.isArray(raw.sizes) ? raw.sizes : [];
  if (name.length < 3) errors.push('Tên sản phẩm cần ít nhất 3 ký tự.');
  if (!description) errors.push('Cần mô tả hình dáng và công năng.');
  if (sizes.length < 1 || sizes.length > 5) errors.push('Cần từ 1 đến 5 size.');
  if (materials.length < 1 || materials.length > 10) errors.push('Cần từ 1 đến 10 mã vật liệu.');
  if (!priceFormula) errors.push('Cần nhập công thức giá.');
  const cleanSizes = sizes.map((size) => {
    const item = size as Partial<ProductSize>;
    return { name: String(item.name ?? '').trim(), widthMm: Number(item.widthMm), depthMm: Number(item.depthMm), heightMm: Number(item.heightMm) };
  });
  cleanSizes.forEach((size, index) => {
    if (!size.name || ![size.widthMm, size.depthMm, size.heightMm].every((value) => Number.isFinite(value) && value > 0)) {
      errors.push(`Size ${index + 1} cần tên và 3 kích thước dương theo mm.`);
    }
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, brief: { name, description, notes, sizes: cleanSizes, materials, priceFormula } };
}

export function countVariants(brief: ProductBrief) { return brief.sizes.length * brief.materials.length; }

export function validateAssetContract(asset: { width: number; height: number; mimeType: string; bytes: number; subjectBounds?: { left: number; top: number; right: number; bottom: number } }) {
  const errors: string[] = [];
  if (asset.width !== 2048 || asset.height !== 2048) errors.push('Ảnh phải đúng 2048×2048 px.');
  if (asset.mimeType !== 'image/webp') errors.push('Ảnh phải ở định dạng WebP.');
  if (asset.bytes >= 100 * 1024) errors.push('Ảnh phải nhỏ hơn 100 kB.');
  if (asset.subjectBounds) {
    const margin = 0.2 * 2048;
    if (asset.subjectBounds.left < margin || asset.subjectBounds.top < margin || 2048 - asset.subjectBounds.right < margin || 2048 - asset.subjectBounds.bottom < margin) {
      errors.push('Sản phẩm phải có khoảng trắng tối thiểu 20% tới các cạnh.');
    }
  }
  return { ok: errors.length === 0, errors };
}
