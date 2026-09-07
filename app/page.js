'use client'

import { useRef, useState } from 'react'

export default function Home() {
  const inputRef = useRef(null)
  const canvasRef = useRef(null)

  const [file, setFile] = useState(null)
  const [src, setSrc] = useState('')
  const [output, setOutput] = useState('')
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(92)
  const [preset, setPreset] = useState('original')
  const [slider, setSlider] = useState(50)
  const [processing, setProcessing] = useState(false)

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) return

    if (src) URL.revokeObjectURL(src)
    if (output) URL.revokeObjectURL(output)

    setFile(f)
    setSrc(URL.createObjectURL(f))
    setOutput('')
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  async function processImage() {
    if (!src) return

    setProcessing(true)

    try {
      const img = new Image()
      img.src = src
      await img.decode()

      let targetWidth = img.naturalWidth * scale
      let targetHeight = img.naturalHeight * scale

      const presets = {
        facebookPortrait: [1080, 1350],
        facebookSquare: [1080, 1080],
        story: [1080, 1920],
        landscape: [1200, 628],
      }

      if (preset !== 'original') {
        const [w, h] = presets[preset]
        targetWidth = w
        targetHeight = h
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d', { alpha: false })

      canvas.width = targetWidth
      canvas.height = targetHeight

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.filter = 'contrast(1.035) saturate(0.98) brightness(1.01)'

      const sourceRatio = img.naturalWidth / img.naturalHeight
      const targetRatio = targetWidth / targetHeight

      let drawWidth = targetWidth
      let drawHeight = targetHeight
      let dx = 0
      let dy = 0

      if (preset !== 'original') {
        if (sourceRatio > targetRatio) {
          drawHeight = targetHeight
          drawWidth = drawHeight * sourceRatio
          dx = (targetWidth - drawWidth) / 2
        } else {
          drawWidth = targetWidth
          drawHeight = drawWidth / sourceRatio
          dy = (targetHeight - drawHeight) / 2
        }
      }

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight)

      canvas.toBlob(
        blob => {
          if (!blob) return

          if (output) URL.revokeObjectURL(output)

          setOutput(URL.createObjectURL(blob))
          setSlider(50)
          setProcessing(false)
        },
        'image/jpeg',
        quality / 100
      )
    } catch (error) {
      console.error(error)
      setProcessing(false)
    }
  }

  function reset() {
    if (src) URL.revokeObjectURL(src)
    if (output) URL.revokeObjectURL(output)

    setFile(null)
    setSrc('')
    setOutput('')
    setScale(2)
    setPreset('original')
    setSlider(50)

    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <main className="page">
      <div className="appShell">

        {/* HEADER */}
        <header className="topbar">
          <div className="brand">
            <div className="brandIcon">P</div>

            <div>
              <div className="brandName">PhotoFlow</div>
              <div className="brandSub">
                Image Optimizer
              </div>
            </div>
          </div>

          <div className="headline">
            <h1>Làm nét & tối ưu hình ảnh</h1>

            <p>
              Upscale · Natural Photo · Social Preset · xử lý trực tiếp
              trên trình duyệt
            </p>
          </div>

          <div className="privacyBadge">
            <span className="shield">✓</span>

            <div>
              <strong>Ưu tiên quyền riêng tư</strong>
              <small>Xử lý cục bộ trên thiết bị</small>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="workspace">

          {/* LEFT */}
          <aside className="sidebar">

            {/* UPLOAD */}
            <div
              className={`uploadBox ${file ? 'hasFile' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={e => handleFile(e.target.files?.[0])}
              />

              {!file ? (
                <>
                  <div className="uploadIcon">↑</div>

                  <strong>
                    Kéo thả ảnh hoặc <span>Chạm để tải</span>
                  </strong>

                  <p>Hỗ trợ JPG, JPEG, PNG, WEBP</p>

                  <button type="button" className="chooseButton">
                    Chọn hình ảnh
                  </button>
                </>
              ) : (
                <>
                  <div className="fileReadyIcon">✓</div>

                  <strong>Ảnh đã sẵn sàng</strong>

                  <div className="fileChip">
                    <div className="fileThumbnail">
                      <img src={src} alt="" />
                    </div>

                    <div className="fileInfo">
                      <b>{file.name}</b>
                      <small>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>
                  </div>

                  <span className="changeFile">
                    Nhấn để chọn ảnh khác
                  </span>
                </>
              )}
            </div>

            {/* NATURAL */}
            <div className="panel">
              <div className="panelTitle">
                <span className="step">1</span>

                <div>
                  <h3>Chế độ tối ưu</h3>
                  <p>Cân chỉnh ảnh tự nhiên hơn</p>
                </div>
              </div>

              <div className="optionSelected">
                <div className="optionIcon">✦</div>

                <div>
                  <strong>Natural Photo</strong>
                  <p>
                    Giảm cảm giác quá sắc, quá bóng và giữ màu ảnh
                    tự nhiên.
                  </p>
                </div>

                <div className="checkCircle">✓</div>
              </div>
            </div>

            {/* SCALE */}
            <div className="panel">
              <div className="panelTitle">
                <span className="step">2</span>

                <div>
                  <h3>Làm nét ảnh</h3>
                  <p>Chọn độ phân giải đầu ra</p>
                </div>
              </div>

              <div className="scaleGrid">
                {[1, 2, 4].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScale(value)}
                    className={
                      scale === value ? 'scaleCard active' : 'scaleCard'
                    }
                  >
                    <strong>{value}×</strong>

                    <span>
                      {value === 1
                        ? 'Giữ nguyên'
                        : value === 2
                          ? 'Rõ nét'
                          : 'Siêu nét'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* PRESET */}
            <div className="panel">
              <div className="panelTitle">
                <span className="step">3</span>

                <div>
                  <h3>Preset mạng xã hội</h3>
                  <p>Tự động resize ảnh</p>
                </div>
              </div>

              <select
                className="select"
                value={preset}
                onChange={e => setPreset(e.target.value)}
              >
                <option value="original">Giữ nguyên tỷ lệ</option>

                <option value="facebookPortrait">
                  Facebook Post · 1080×1350
                </option>

                <option value="facebookSquare">
                  Facebook Ads · 1080×1080
                </option>

                <option value="story">
                  Story / TikTok · 1080×1920
                </option>

                <option value="landscape">
                  Facebook Landscape · 1200×628
                </option>
              />

              <div className="qualityRow">
                <div>
                  <strong>Chất lượng JPEG</strong>
                  <span>{quality}%</span>
                </div>

                <input
                  type="range"
                  min="70"
                  max="100"
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              className="processButton"
              onClick={processImage}
              disabled={!file || processing}
            >
              {processing ? (
                <>
                  <span className="spinner" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>✦</span>
                  Khởi chạy xử lý ảnh
                </>
              )}
            </button>

            <div className="localNotice">
              🔒 Không upload ảnh lên server trong bản V1
            </div>
          </aside>

          {/* RIGHT */}
          <section className="resultArea">

            <div className="statusCard">
              <div>
                <span className="eyebrow">TRẠNG THÁI XỬ LÝ</span>

                <h2>
                  {output
                    ? 'Ảnh đã được xử lý'
                    : file
                      ? 'Ảnh sẵn sàng để tối ưu'
                      : 'Chưa có hình ảnh'}
                </h2>

                <p>
                  {output
                    ? 'Bạn có thể kéo thanh so sánh để xem sự khác biệt.'
                    : 'Upload một hình ảnh để bắt đầu.'}
                </p>
              </div>

              <div className={`statusPill ${output ? 'done' : ''}`}>
                <span />
                {output ? 'Hoàn tất' : 'Chờ ảnh'}
              </div>
            </div>

            {/* PREVIEW */}
            <div className="previewCard">
              {!src ? (
                <div className="emptyPreview">
                  <div className="emptyIcon">▧</div>

                  <h3>Ảnh xem trước sẽ hiển thị tại đây</h3>

                  <p>
                    Upload một ảnh JPG, PNG hoặc WebP để bắt đầu.
                  </p>
                </div>
              ) : (
                <>
                  <div className="previewHeader">
                    <span className="beforeLabel">
                      GỐC
                    </span>

                    <span className="afterLabel">
                      {output ? 'ĐÃ XỬ LÝ' : 'PREVIEW'}
                    </span>
                  </div>

                  <div
                    className="comparison"
                    style={{ '--position': `${slider}%` }}
                  >
                    <img
                      className="imageAfter"
                      src={output || src}
                      alt="Processed"
                    />

                    {output && (
                      <>
                        <div className="beforeLayer">
                          <img src={src} alt="Original" />
                        </div>

                        <div className="divider">
                          <div className="sliderHandle">
                            ‹ ›
                          </div>
                        </div>

                        <input
                          className="comparisonRange"
                          type="range"
                          min="0"
                          max="100"
                          value={slider}
                          onChange={e => setSlider(e.target.value)}
                        />
                      </>
                    )}
                  </div>

                  {output && (
                    <div className="previewHint">
                      ↔ Kéo thanh trượt để so sánh trước và sau
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="infoGrid">

              <div className="infoCard">
                <div className="infoTitle">
                  <span>✦</span>
                  Tối ưu ảnh
                </div>

                <ul>
                  <li>Upscale trực tiếp bằng Canvas</li>
                  <li>Natural Photo nhẹ</li>
                  <li>Crop theo Social Preset</li>
                  <li>Điều chỉnh JPEG quality</li>
                </ul>
              </div>

              <div className="infoCard">
                <div className="infoTitle">
                  <span>🔒</span>
                  Quyền riêng tư
                </div>

                <ul>
                  <li>Không cần đăng nhập</li>
                  <li>Không lưu ảnh trên database</li>
                  <li>Không upload ảnh trong V1</li>
                  <li>Xử lý ngay trên trình duyệt</li>
                </ul>
              </div>

            </div>

            {output && (
              <div className="actions">
                <a
                  className="downloadButton"
                  href={output}
                  download="photoflow-optimized.jpg"
                >
                  ↓ Tải ảnh đã xử lý (.jpg)
                </a>

                <button className="resetButton" onClick={reset}>
                  Làm ảnh khác
                </button>
              </div>
            )}

          </section>
        </div>

        <footer className="footer">
          <div>
            <strong>PhotoFlow</strong>
            <span> · Công cụ tối ưu ảnh dành cho creator & marketer</span>
          </div>

          <div>
            🔒 Local-first processing
          </div>
        </footer>

        <canvas ref={canvasRef} hidden />
      </div>
    </main>
  )
}
