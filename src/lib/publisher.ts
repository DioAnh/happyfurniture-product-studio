import { getSupabaseAdmin } from '@/lib/supabase';
import type { ProductBrief, ProductSize } from '@/lib/product-pipeline';

const BASE_IMAGE_URL = () => `${process.env.HAPPY_FURNITURE_SUPABASE_URL}/storage/v1/object/public/product-images`;

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parsePriceFormula(formula: string, widthMm: number) {
  const numberMatch = formula.replace(/\./g, '').match(/\d+/);
  const base = numberMatch ? Number(numberMatch[0]) : 0;
  if (!base || !widthMm) throw new Error('Công thức giá cần có đơn giá theo ngang và kích thước ngang.');
  return Math.round(base * (widthMm / 1000));
}

function sizeCode(size: ProductSize) { return size.name.trim().toUpperCase().replace(/\s+/g, '-'); }

export type PublishInput = ProductBrief & {
  typeCode?: string;
  designCode?: string;
  baseSku?: string;
  rooms?: string[];
  imageUrls?: Record<string, string>;
};

export function buildPublicationPayload(input: PublishInput) {
  const baseSku = (input.baseSku || `${(input.typeCode || 'HF').toUpperCase()}-${(input.designCode || 'MOD').toUpperCase()}-${Date.now().toString().slice(-2)}`).replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  const typeCode = (input.typeCode || 'HF').toUpperCase();
  const designCode = (input.designCode || 'MOD').toUpperCase();
  const slug = slugify(input.name);
  const rooms = input.rooms?.length ? input.rooms : ['Phòng khách'];
  const group = { base_sku: baseSku, name: input.name, slug, design_code: designCode, type_code: typeCode, description: input.description, rooms: JSON.stringify(rooms) };
  const products = input.sizes.flatMap((size) => input.materials.map((materialCode) => {
    const code = sizeCode(size);
    const sku = `${baseSku}-${code}-${materialCode}`;
    const price = parsePriceFormula(input.priceFormula, size.widthMm);
    const imageKey = `${code}/${materialCode}`;
    const imageUrl = input.imageUrls?.[imageKey] || `${BASE_IMAGE_URL()}/${baseSku}/${code}/${materialCode}/hero-v1.webp`;
    return {
      name: `${input.name} (${code} - ${materialCode})`,
      price,
      material: 'MDF chống ẩm Melamine Ba Thanh',
      category: 'Nội thất',
      description: input.description,
      type_code: typeCode,
      size: code,
      sku,
      serial_number: sku,
      old_price: Math.round(price * 1.12),
      stock_status: 'in_stock',
      images: [imageUrl],
      dimensions: `${size.widthMm}x${size.depthMm}x${size.heightMm}`,
      slug: `${slug}-${code.toLowerCase()}-${materialCode.toLowerCase()}`,
      rooms,
      seo_title: `${input.name} - ${materialCode}`,
      material_code: materialCode,
      is_avatar: code === sizeCode(input.sizes[0]) && materialCode === input.materials[0],
    };
  }));
  return { group, products };
}

export async function publishProductFamily(input: PublishInput) {
  const payload = buildPublicationPayload(input);
  if (process.env.HAPPY_FURNITURE_ALLOW_LIVE_PUBLISH !== 'true') return { mode: 'dry-run' as const, payload };
  const supabase = getSupabaseAdmin();
  const existing = await supabase.from('product_groups').select('id,base_sku,slug').or(`base_sku.eq.${payload.group.base_sku},slug.eq.${payload.group.slug}`).limit(1);
  if (existing.error) throw existing.error;
  if (existing.data?.length) throw new Error(`Product group đã tồn tại: ${payload.group.base_sku}`);
  const insertedGroup = await supabase.from('product_groups').insert(payload.group).select('id').single();
  if (insertedGroup.error || !insertedGroup.data) throw insertedGroup.error || new Error('Không tạo được product group.');
  const products = payload.products.map((product) => ({ ...product, group_id: insertedGroup.data.id }));
  const insertedProducts = await supabase.from('products').insert(products).select('id,sku');
  if (insertedProducts.error) throw insertedProducts.error;
  return { mode: 'live' as const, groupId: insertedGroup.data.id, products: insertedProducts.data ?? [], payload };
}
