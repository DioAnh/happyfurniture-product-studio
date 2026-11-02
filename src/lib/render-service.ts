import sharp from 'sharp';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateAssetContract, type ProductBrief, type ProductSize } from '@/lib/product-pipeline';

function materialUrl(code: string) {
  const base = process.env.HAPPY_FURNITURE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/materials/BT_${code.replace(/^BT/i, '')}_MDF_Melamine_Chong_Am_E2_Ba_Thanh.webp`;
}

async function platformImage(prompt: string, originalImageUrl: string) {
  const apiUrl = process.env.MANUS_API_URL;
  const apiKey = process.env.MANUS_API_KEY;
  if (!apiUrl || !apiKey) throw new Error('Image service is not available in this environment.');
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'connect-protocol-version': '1' };
  const modelResponse = await fetch(`${apiUrl}/images.v1.ImageService/ListModels`, { method: 'POST', headers, body: '{}' });
  if (!modelResponse.ok) throw new Error(`Không đọc được danh sách model ảnh (${modelResponse.status}).`);
  const models = await modelResponse.json() as { models?: Array<{ model?: string }> };
  const model = models.models?.[0]?.model;
  const payload: Record<string, unknown> = { prompt, originalImages: [{ url: originalImageUrl, mimeType: 'image/webp' }] };
  if (model) payload.model = model;
  const response = await fetch(`${apiUrl}/images.v1.ImageService/GenerateImage`, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await response.json() as { image?: { url?: string; b64Json?: string; mimeType?: string }; error?: { message?: string } };
  if (!response.ok || !data.image) throw new Error(data.error?.message || `Render ảnh thất bại (${response.status}).`);
  if (data.image.b64Json) return Buffer.from(data.image.b64Json, 'base64');
  if (!data.image.url) throw new Error('Image service không trả về URL hoặc base64.');
  const imageResponse = await fetch(data.image.url);
  if (!imageResponse.ok) throw new Error('Không tải được ảnh render tạm thời.');
  return Buffer.from(await imageResponse.arrayBuffer());
}

async function normalize(image: Buffer) {
  let quality = 78;
  let output = await sharp(image).flatten({ background: '#ffffff' }).resize(2048, 2048, { fit: 'contain', background: '#ffffff' }).webp({ quality, effort: 6 }).toBuffer();
  while (output.length >= 100 * 1024 && quality > 25) {
    quality -= 5;
    output = await sharp(image).flatten({ background: '#ffffff' }).resize(2048, 2048, { fit: 'contain', background: '#ffffff' }).webp({ quality, effort: 6 }).toBuffer();
  }
  const stats = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  let left = stats.info.width, top = stats.info.height, right = 0, bottom = 0;
  for (let y = 0; y < stats.info.height; y += 4) for (let x = 0; x < stats.info.width; x += 4) {
    const i = (y * stats.info.width + x) * stats.info.channels;
    const dark = stats.data[i] < 247 || stats.data[i + 1] < 247 || stats.data[i + 2] < 247;
    if (dark) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
  }
  const validation = validateAssetContract({ width: 2048, height: 2048, mimeType: 'image/webp', bytes: output.length, subjectBounds: { left, top, right, bottom } });
  if (!validation.ok) throw new Error(validation.errors.join(' '));
  return output;
}

export async function renderVariant(brief: ProductBrief, size: ProductSize, materialCode: string, baseSku: string) {
  const prompt = `Studio product hero render for a furniture ecommerce catalog. Render exactly this product: ${brief.name}. Product description: ${brief.description}. Geometry and size: ${size.widthMm} mm wide x ${size.depthMm} mm deep x ${size.heightMm} mm high. Preserve the same product geometry, camera, proportions, hardware, seams and panel layout for this size. Use the supplied Ba Thanh MDF Melamine material code ${materialCode} only on the wooden surfaces. Keep all metal handles identical and neutral. Make the top plane the brightest, front plane medium, side plane darker so the 3D form is unmistakable. Soft realistic studio shadow, pure white background, centered object, square catalog hero shot, minimum 20% white clearance on every side, no room scene, no extra objects, no text.`;
  const raw = await platformImage(prompt, materialUrl(materialCode));
  const output = await normalize(raw);
  const path = `${baseSku}/${size.name.toUpperCase()}/${materialCode.toUpperCase()}/hero-v1.webp`;
  const { error } = await getSupabaseAdmin().storage.from('product-images').upload(path, output, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw error;
  const publicUrl = `${process.env.HAPPY_FURNITURE_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  return { path, publicUrl, bytes: output.length };
}
