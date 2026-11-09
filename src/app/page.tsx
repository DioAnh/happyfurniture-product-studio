'use client';

import { useMemo, useState } from 'react';
import { DEFAULT_MATERIALS, type ProductSize } from '@/lib/product-pipeline';

const initialSizes: ProductSize[] = [{ name: 'M', widthMm: 1500, depthMm: 420, heightMm: 850 }];

export default function ProductStudio() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [sizes, setSizes] = useState<ProductSize[]>(initialSizes);
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS);
  const [priceFormula, setPriceFormula] = useState('2.950.000 × ngang (mét)');
  const [baseSku, setBaseSku] = useState('LS-MOD-NEW');
  const [typeCode, setTypeCode] = useState('LS');
  const [designCode, setDesignCode] = useState('MOD');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState('');
  const [renderedCount, setRenderedCount] = useState(0);

  const variantCount = useMemo(() => sizes.length * materials.length, [sizes.length, materials.length]);

  function updateSize(index: number, key: keyof ProductSize, value: string) {
    setSizes((current) => current.map((size, sizeIndex) => sizeIndex === index ? { ...size, [key]: key === 'name' ? value : Number(value) } : size));
  }

  function addSize() {
    if (sizes.length < 5) setSizes((current) => [...current, { name: `Size ${current.length + 1}`, widthMm: 900, depthMm: 400, heightMm: 800 }]);
  }

  function removeSize(index: number) {
    if (sizes.length > 1) setSizes((current) => current.filter((_, sizeIndex) => sizeIndex !== index));
  }

  function toggleMaterial(code: string) {
    setMaterials((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  async function createJob() {
    setBusy(true); setMessage('Đang kiểm tra brief…');
    const response = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, notes, sizes, materials, priceFormula }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage((data.errors ?? [data.error]).join(' ')); return; }
    setJobId(data.job.id); setRenderedCount(0); setMessage(`Đã tạo ${data.job.id}. Bấm “Bắt đầu render variants” để tạo và upload toàn bộ ${data.job.variantCount} ảnh.`);
  }

  async function startVariants() {
    if (!jobId) {
      setMessage('Chưa có product job. Hãy điền brief rồi bấm “Tạo master preview” trước.');
      return;
    }
    setBusy(true); setRenderedCount(0); setMessage(`Đang render 0/${variantCount} biến thể…`);
    const imageUrls: Record<string, string> = {};
    let completed = 0;
    try {
      for (const size of sizes) {
        for (const materialCode of materials) {
          const response = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, notes, sizes, materials, priceFormula, sizeName: size.name, materialCode, baseSku }) });
          const data = await response.json();
          if (!response.ok || !data.asset?.publicUrl) throw new Error(`${size.name}/${materialCode}: ${data.error ?? 'Không nhận được ảnh đã upload.'}`);
          const sizeCode = size.name.trim().toUpperCase().replace(/\s+/g, '-');
          imageUrls[`${sizeCode}/${materialCode}`] = data.asset.publicUrl;
          completed += 1;
          setRenderedCount(completed);
          setMessage(`Đã render ${completed}/${variantCount}: ${size.name} / ${materialCode}`);
        }
      }
      setMessage(`Đã upload đủ ${completed} ảnh. Đang publish product family lên website…`);
      const publishResponse = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description, notes, sizes, materials, priceFormula, baseSku, typeCode, designCode, rooms: ['Phòng khách'], imageUrls }) });
      const publication = await publishResponse.json();
      if (!publishResponse.ok) throw new Error(publication.error ?? 'Publish thất bại.');
      setMessage(publication.liveEnabled ? `Hoàn tất: ${completed} ảnh đã upload và product family đã lên website.` : `Đã upload ${completed} ảnh. Payload publish đang ở dry-run; bật HAPPY_FURNITURE_ALLOW_LIVE_PUBLISH=true trên Vercel để ghi sản phẩm live.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Render variants thất bại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand"><div className="brand-mark">HF</div><div><strong>Product Studio</strong><small>Happy Furniture</small></div></div>
        <nav><p className="rail-title">Workflow</p><div className="step active"><span className="step-dot">01</span><span>Product brief</span></div><div className="step"><span className="step-dot">02</span><span>Geometry masters</span></div><div className="step"><span className="step-dot">03</span><span>Material variants</span></div><div className="step"><span className="step-dot">04</span><span>Validate & publish</span></div></nav>
        <div className="rail-footer">Owner workspace<br />Customer storefront remains separate.</div>
      </aside>

      <main className="main">
        <header className="topbar"><div><div className="eyebrow">New product / 01</div><h1>Build a product family.</h1><p className="subtitle">Nhập thông tin một lần. Studio sẽ giữ nguyên geometry theo từng size, thay đổi duy nhất vật liệu, rồi chuẩn hóa và đưa bộ ảnh lên Supabase.</p></div><div className="owner-pill"><span className="owner-dot" /> Owner access only</div></header>
        <div className="workspace">
          <section className="card">
            <div className="card-head"><div><h2>Product brief</h2><p>Thông tin nền để tạo master render.</p></div><span className="eyebrow">Draft</span></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="field full"><label>Tên sản phẩm</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Tủ trang trí phòng khách hiện đại" /></div>
                <div className="field full"><label>Mô tả hình dáng & công năng</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả số cánh, hộc kéo, tay nắm, phong cách, công năng…" /></div>
                <div className="field full"><label>Ghi chú geometry</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ví dụ: mặt trên sáng nhất, mặt trước trung gian, mặt bên tối hơn; tay nắm kim loại giữ nguyên giữa mọi mã." /></div>
                <div className="field"><label>Base SKU</label><input value={baseSku} onChange={(event) => setBaseSku(event.target.value.toUpperCase())} /></div>
                <div className="field"><label>Type code</label><input value={typeCode} onChange={(event) => setTypeCode(event.target.value.toUpperCase())} /></div>
                <div className="field"><label>Design code</label><input value={designCode} onChange={(event) => setDesignCode(event.target.value.toUpperCase())} /></div>
              </div>
              <div className="divider" />
              <p className="section-label">Kích thước theo size / mm</p>
              <div className="size-row"><span className="hint">Tên size</span><span className="hint">Ngang</span><span className="hint">Sâu</span><span className="hint">Cao</span><span /></div>
              {sizes.map((size, index) => <div className="size-row" key={`${size.name}-${index}`}><input className="size-name" value={size.name} onChange={(event) => updateSize(index, 'name', event.target.value)} /><input type="number" value={size.widthMm} onChange={(event) => updateSize(index, 'widthMm', event.target.value)} /><input type="number" value={size.depthMm} onChange={(event) => updateSize(index, 'depthMm', event.target.value)} /><input type="number" value={size.heightMm} onChange={(event) => updateSize(index, 'heightMm', event.target.value)} /><button className="remove" onClick={() => removeSize(index)} aria-label="Xóa size">×</button></div>)}
              <button className="btn secondary" onClick={addSize} disabled={sizes.length >= 5}>+ Thêm size</button>
              <div className="divider" />
              <p className="section-label">Mã vân gỗ Ba Thanh / {materials.length} selected</p>
              <div className="materials">{DEFAULT_MATERIALS.map((code) => <button className={`material ${materials.includes(code) ? 'selected' : ''}`} key={code} onClick={() => toggleMaterial(code)}>{materials.includes(code) ? '✓ ' : ''}{code}</button>)}</div>
              <span className="hint" style={{ display: 'block', marginTop: 9 }}>Danh mục mã màu được đối chiếu với bảng materials và ảnh tham chiếu trong Supabase Storage.</span>
              <div className="divider" />
              <div className="form-grid"><div className="field"><label>Công thức giá</label><input value={priceFormula} onChange={(event) => setPriceFormula(event.target.value)} /><span className="hint">Được lưu cùng product family để kiểm tra trước publish.</span></div><div className="field"><label>Quy mô bộ ảnh</label><input value={`${variantCount} ảnh / ${sizes.length} size × ${materials.length} mã`} readOnly /><span className="hint">Mỗi size có một geometry lock riêng.</span></div></div>
              <div className="actions"><button className="btn secondary" onClick={() => setMessage('Bản nháp đang nằm trên màn hình này; chưa ghi live database.')}>Save draft</button><button className="btn accent" onClick={createJob} disabled={busy}>{busy ? 'Đang xử lý…' : 'Tạo master preview →'}</button></div>
              {message && <div className="note" style={{ marginTop: 16 }}>{message}</div>}
            </div>
          </section>
          <aside className="side-stack">
            <div className="card readiness"><h3>Publish readiness</h3><div className="readiness-item"><span>Product brief</span><span className={`status ${name && description ? 'ok' : 'pending'}`}>{name && description ? 'ready' : 'waiting'}</span></div><div className="readiness-item"><span>Geometry masters</span><span className="status pending">after approval</span></div><div className="readiness-item"><span>Variant renders</span><span className="status">{variantCount} queued</span></div><div className="readiness-item"><span>Image contract</span><span className="status">2048 / WebP / &lt;100kB</span></div><div className="readiness-item"><span>Supabase publish</span><span className="status pending">schema adapter</span></div></div>
              <div className="card readiness"><p className="section-label">Current job</p><div className="job-count">{jobId ? `${renderedCount}/${variantCount}` : '—'}</div><p className="muted">{jobId ? `Job ${jobId}. Mỗi biến thể sẽ được tạo ảnh, kiểm tra, upload Supabase rồi publish sau cùng.` : 'Chưa có job trong phiên này. Hãy tạo master preview trước.'}</p><button className="btn" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={startVariants}>{busy ? `Đang render ${renderedCount}/${variantCount}…` : 'Bắt đầu render variants'}</button></div>
            <div className="note"><strong>Geometry lock</strong><br />Một master được duyệt cho từng size. Các mã màu không được tự ý thay đổi tỷ lệ, tay nắm, góc máy, bóng đổ hoặc tương phản mặt trên / mặt trước / mặt bên.</div>
          </aside>
        </div>
      </main>
    </div>
  );
}
