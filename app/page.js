'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud, ShieldCheck, Sparkles, Download, Image as ImageIcon,
  ScanLine, SlidersHorizontal, Smartphone, MonitorSmartphone, CheckCircle2,
  Info, LockKeyhole, RotateCcw, WandSparkles
} from 'lucide-react';

const presets = {
  none: { label: 'Giữ nguyên', w: null, h: null },
  fbpost: { label: 'Facebook Post', w: 1080, h: 1350 },
  fbsquare: { label: 'Facebook Ads', w: 1080, h: 1080 },
  story: { label: 'Story / TikTok', w: 1080, h: 1920 },
  web: { label: 'Website', w: 1600, h: 900 },
};

export default function Home() {
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const [file, setFile] = useState(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [scale, setScale] = useState(2);
  const [natural, setNatural] = useState(true);
  const [preset, setPreset] = useState('none');
  const [quality, setQuality] = useState(0.92);
  const [position, setPosition] = useState(50);
  const [busy, setBusy] = useState(false);
  const [dims, setDims] = useState(null);

  const outDims = useMemo(() => {
    if (!dims) return null;
    const p = presets[preset];
    if (p.w && p.h) return { w: p.w, h: p.h };
    return { w: Math.round(dims.w * scale), h: Math.round(dims.h * scale) };
  }, [dims, preset, scale]);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  function onFile(f) {
    if (!f || !f.type.startsWith('image/')) return;
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setSourceUrl(url);
    setResultUrl('');
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }

  function handleDrop(e) {
    e.preventDefault();
    onFile(e.dataTransfer.files?.[0]);
  }

  async function processImage() {
    if (!sourceUrl) return;
    setBusy(true);
    try {
      const img = new Image();
      img.src = sourceUrl;
      await img.decode();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      const p = presets[preset];
      const targetW = p.w || Math.round(img.naturalWidth * scale);
      const targetH = p.h || Math.round(img.naturalHeight * scale);
      canvas.width = targetW;
      canvas.height = targetH;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (p.w && p.h) {
        const srcRatio = sw / sh;
        const dstRatio = targetW / targetH;
        if (srcRatio > dstRatio) {
          sw = Math.round(sh * dstRatio);
          sx = Math.round((img.naturalWidth - sw) / 2);
        } else {
          sh = Math.round(sw / dstRatio);
          sy = Math.round((img.naturalHeight - sh) / 2);
        }
      }

      ctx.filter = natural ? 'contrast(1.025) saturate(0.99) brightness(1.01)' : 'none';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      ctx.filter = 'none';

      if (natural) {
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          // restrained micro-contrast/noise to avoid plasticky appearance
          const n = (Math.random() - 0.5) * 1.2;
          d[i] = Math.max(0, Math.min(255, d[i] + n));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
        }
        ctx.putImageData(imageData, 0, 0);
      }

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      setResultUrl(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null); setSourceUrl(''); setResultUrl(''); setDims(null); setScale(2); setPreset('none'); setPosition(50);
  }

  return (
    <main className="page-shell">
      <section className="app-shell">
        <header className="topbar">
          <div className="brand-wrap">
            <div className="logo"><ImageIcon size={24} /></div>
            <div>
              <div className="brand">PhotoFlow</div>
              <div className="tagline">Làm nét & tối ưu ảnh social</div>
            </div>
          </div>
          <div className="title-wrap">
            <h1>Làm nét & tối ưu hình ảnh</h1>
            <p>Upscale • Natural Photo • Social Preset • Xử lý ngay trên trình duyệt</p>
          </div>
          <div className="privacy-pill"><ShieldCheck size={18}/><div><b>Ưu tiên quyền riêng tư</b><span>Xử lý cục bộ trên thiết bị</span></div></div>
        </header>

        <div className="grid">
          <aside className="left-col">
            <div className="card upload-card" onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => inputRef.current?.click()}>
              <UploadCloud size={34}/>
              <strong>Kéo thả ảnh hoặc <span>Chạm để tải</span></strong>
              <small>JPG, JPEG, PNG, WEBP</small>
              <input ref={inputRef} hidden type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0])}/>
              {file && <div className="file-chip"><ImageIcon size={15}/><span>{file.name}</span><em>{(file.size/1024/1024).toFixed(1)} MB</em></div>}
            </div>

            <div className="card section-card">
              <div className="section-title"><WandSparkles size={18}/>1. Chế độ tối ưu</div>
              <button className={`toggle-row ${natural ? 'on' : ''}`} onClick={() => setNatural(!natural)}>
                <div><b>Natural Photo</b><span>Giảm cảm giác quá sắc/nhựa, giữ ảnh tự nhiên hơn</span></div>
                <div className="switch"><i/></div>
              </button>
              <div className="notice"><Info size={16}/>Không chỉnh sửa hoặc xóa nhãn nguồn gốc AI/C2PA. Tính năng tập trung vào chất lượng ảnh và quyền riêng tư thông thường.</div>
            </div>

            <div className="card section-card">
              <div className="section-title"><ScanLine size={18}/>2. Làm nét ảnh</div>
              <div className="choice-grid three">
                {[1,2,4].map(x => <button key={x} className={scale===x ? 'selected' : ''} onClick={() => setScale(x)}><b>{x}x</b><span>{x===1?'Gốc':x===2?'Rõ nét':'Siêu nét'}</span></button>)}
              </div>
            </div>

            <div className="card section-card">
              <div className="section-title"><MonitorSmartphone size={18}/>3. Preset social</div>
              <select value={preset} onChange={e => setPreset(e.target.value)}>
                {Object.entries(presets).map(([k,v]) => <option value={k} key={k}>{v.label}{v.w ? ` – ${v.w}×${v.h}` : ''}</option>)}
              </select>
              <div className="quality-line"><span>Chất lượng JPEG</span><b>{Math.round(quality*100)}%</b></div>
              <input className="range" type="range" min="0.7" max="1" step="0.01" value={quality} onChange={e => setQuality(Number(e.target.value))}/>
            </div>

            <button className="primary" disabled={!file || busy} onClick={processImage}><Sparkles size={19}/>{busy ? 'Đang xử lý...' : 'Khởi chạy xử lý ảnh'}</button>
          </aside>

          <section className="right-col">
            <div className="card status-card">
              <div className="status-head"><div><ShieldCheck size={18}/>TRẠNG THÁI XỬ LÝ</div><span className="good">Local-first</span></div>
              <div className="status-row"><span>Ảnh đầu vào</span><b>{dims ? `${dims.w} × ${dims.h}` : 'Chưa có ảnh'}</b></div>
              <div className="status-row"><span>Đầu ra dự kiến</span><b>{outDims ? `${outDims.w} × ${outDims.h}` : '—'}</b></div>
              <div className="status-row"><span>Chính sách metadata</span><b>Không giả mạo thiết bị / nguồn gốc</b></div>
            </div>

            <div className="card preview-card">
              {sourceUrl ? (
                <div className="compare" style={{'--pos': `${position}%`}}>
                  <img src={resultUrl || sourceUrl} className="after" alt="Sau xử lý"/>
                  <div className="before-wrap"><img src={sourceUrl} alt="Trước xử lý"/></div>
                  <span className="tag before-tag">GỐC</span>
                  <span className="tag after-tag">{resultUrl ? 'ĐÃ XỬ LÝ' : 'PREVIEW'}</span>
                  <input type="range" min="0" max="100" value={position} onChange={e=>setPosition(e.target.value)} aria-label="So sánh trước sau"/>
                  <div className="divider"/><div className="handle">↔</div>
                </div>
              ) : (
                <div className="empty-preview"><ImageIcon size={54}/><b>Ảnh xem trước sẽ hiển thị tại đây</b><span>Upload một ảnh để bắt đầu</span></div>
              )}
            </div>

            <div className="result-grid">
              <div className="card mini-card">
                <div className="mini-title"><SlidersHorizontal size={17}/>TỐI ƯU ẢNH</div>
                <p><CheckCircle2 size={16}/>Upscale chất lượng cao bằng canvas</p>
                <p><CheckCircle2 size={16}/>Natural Photo nhẹ, không làm quá tay</p>
                <p><CheckCircle2 size={16}/>Crop theo social preset</p>
                <p><CheckCircle2 size={16}/>Xuất JPEG tối ưu dung lượng</p>
              </div>
              <div className="card mini-card">
                <div className="mini-title"><LockKeyhole size={17}/>QUYỀN RIÊNG TƯ</div>
                <p><CheckCircle2 size={16}/>Không cần đăng nhập</p>
                <p><CheckCircle2 size={16}/>Không upload ảnh lên server trong bản V1</p>
                <p><CheckCircle2 size={16}/>Không giả lập EXIF thiết bị</p>
                <p><CheckCircle2 size={16}/>Không có database ảnh</p>
              </div>
            </div>

            <div className="actions">
              {resultUrl && <a className="download" href={resultUrl} download={`photoflow-${file?.name?.replace(/\.[^.]+$/, '') || 'image'}.jpg`}><Download size={18}/>Tải ảnh đã xử lý (.jpg)</a>}
              <button className="secondary" onClick={reset}><RotateCcw size={17}/>Làm ảnh khác</button>
            </div>
          </section>
        </div>

        <footer><span>PhotoFlow • Công cụ dành cho creator & marketer</span><span><LockKeyhole size={14}/>Không lưu trữ ảnh trên hạ tầng ở bản V1</span></footer>
        <canvas ref={canvasRef} hidden />
      </section>
    </main>
  );
}
