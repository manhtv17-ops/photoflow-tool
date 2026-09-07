'use client'

import { useEffect, useRef, useState } from 'react'
import pica from 'pica'

const PRESETS = {
  original: null,
  fbPortrait: { w: 1080, h: 1350 },
  fbSquare: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  landscape: { w: 1200, h: 628 },
}

export default function Home() {
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [outputUrl, setOutputUrl] = useState('')

  const [scale, setScale] = useState(2)
  const [preset, setPreset] = useState('original')
  const [quality, setQuality] = useState(92)

  const [slider, setSlider] = useState(50)

  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Chờ hình ảnh')

  const [originalInfo, setOriginalInfo] = useState(null)
  const [outputInfo, setOutputInfo] = useState(null)

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [originalUrl, outputUrl])

  async function handleFile(selectedFile) {
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh.')
      return
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('Ảnh tối đa 20MB.')
      return
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (outputUrl) URL.revokeObjectURL(outputUrl)

    const url = URL.createObjectURL(selectedFile)

    const img = new Image()
    img.src = url
    await img.decode()

    setFile(selectedFile)
    setOriginalUrl(url)
    setOutputUrl('')

    setOriginalInfo({
      width: img.naturalWidth,
      height: img.naturalHeight,
      size: selectedFile.size,
      type: selectedFile.type,
    })

    setOutputInfo(null)

    setStatus('ready')
    setProgress(0)
    setStatusText('Ảnh sẵn sàng xử lý')
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  async function imageToCanvas(img) {
    const canvas = document.createElement('canvas')

    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    })

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.drawImage(img, 0, 0)

    return canvas
  }

  function applyNaturalPhoto(canvas) {
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )

    const d = imageData.data

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i]
      let g = d[i + 1]
      let b = d[i + 2]

      const avg = (r + g + b) / 3

      // Saturation nhẹ hơn
      const sat = 0.965

      r = avg + (r - avg) * sat
      g = avg + (g - avg) * sat
      b = avg + (b - avg) * sat

      // Soft contrast
      const contrast = 1.025

      r = (r - 128) * contrast + 128
      g = (g - 128) * contrast + 128
      b = (b - 128) * contrast + 128

      // Highlight roll-off nhẹ
      if (r > 220) r = 220 + (r - 220) * 0.7
      if (g > 220) g = 220 + (g - 220) * 0.7
      if (b > 220) b = 220 + (b - 220) * 0.7

      d[i] = Math.max(0, Math.min(255, r))
      d[i + 1] = Math.max(0, Math.min(255, g))
      d[i + 2] = Math.max(0, Math.min(255, b))
    }

    ctx.putImageData(imageData, 0, 0)

    return canvas
  }

  async function resizeWithPica(sourceCanvas, width, height) {
    const output = document.createElement('canvas')

    output.width = width
    output.height = height

    const resizer = pica()

    await resizer.resize(sourceCanvas, output, {
      filter: 'mks2013',
      unsharpAmount: 120,
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    })

    return output
  }

  async function cropToPreset(sourceCanvas, targetW, targetH) {
    const sourceRatio =
      sourceCanvas.width / sourceCanvas.height

    const targetRatio = targetW / targetH

    let cropW = sourceCanvas.width
    let cropH = sourceCanvas.height

    let sx = 0
    let sy = 0

    if (sourceRatio > targetRatio) {
      cropW = sourceCanvas.height * targetRatio
      sx = (sourceCanvas.width - cropW) / 2
    } else {
      cropH = sourceCanvas.width / targetRatio
      sy = (sourceCanvas.height - cropH) / 2
    }

    const cropCanvas = document.createElement('canvas')

    cropCanvas.width = cropW
    cropCanvas.height = cropH

    const cropCtx = cropCanvas.getContext('2d')

    cropCtx.drawImage(
      sourceCanvas,
      sx,
      sy,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    )

    return resizeWithPica(
      cropCanvas,
      targetW,
      targetH
    )
  }

  async function aiUpscale(imageElement, factor) {
    if (factor === 1) {
      return imageToCanvas(imageElement)
    }

    setStatusText('Đang tải AI Super Resolution...')
    setProgress(15)

    const UpscalerModule = await import('upscaler')
    const Upscaler = UpscalerModule.default

    let model

    if (factor === 2) {
      model = (
        await import('@upscalerjs/esrgan-slim/2x')
      ).default
    } else {
      model = (
        await import('@upscalerjs/esrgan-slim/4x')
      ).default
    }

    const upscaler = new Upscaler({
      model,
    })

    setStatusText(
      factor === 2
        ? 'AI đang upscale ảnh 2×...'
        : 'AI đang upscale ảnh 4×...'
    )

    setProgress(30)

    const result = await upscaler.upscale(
      imageElement,
      {
        output: 'base64',
        patchSize: 64,
        padding: 2,

        progress: percent => {
          const p =
            30 +
            Math.round(
              Number(percent || 0) * 45
            )

          setProgress(
            Math.min(75, p)
          )
        },
      }
    )

    const resultImage = new Image()

    resultImage.src = result

    await resultImage.decode()

    const canvas =
      await imageToCanvas(resultImage)

    try {
      upscaler.dispose()
    } catch {}

    return canvas
  }

  async function processImage() {
    if (!originalUrl) return

    setStatus('processing')
    setOutputUrl('')
    setOutputInfo(null)

    try {
      setProgress(5)
      setStatusText('Đang đọc ảnh...')

      const img = new Image()

      img.src = originalUrl

      await img.decode()

      let workingCanvas

      try {
        workingCanvas =
          await aiUpscale(img, scale)
      } catch (err) {
        console.warn(
          'AI upscale lỗi, fallback Pica:',
          err
        )

        setStatusText(
          'AI không khả dụng, đang dùng bộ upscale chất lượng cao...'
        )

        setProgress(45)

        const base =
          await imageToCanvas(img)

        workingCanvas =
          await resizeWithPica(
            base,
            img.naturalWidth * scale,
            img.naturalHeight * scale
          )
      }

      setStatusText(
        'Đang cân màu Natural Photo...'
      )

      setProgress(80)

      workingCanvas =
        applyNaturalPhoto(
          workingCanvas
        )

      if (preset !== 'original') {
        setStatusText(
          'Đang áp dụng Social Preset...'
        )

        setProgress(87)

        const p = PRESETS[preset]

        workingCanvas =
          await cropToPreset(
            workingCanvas,
            p.w,
            p.h
          )
      }

      setStatusText(
        'Đang tối ưu file JPEG...'
      )

      setProgress(94)

      const resizer = pica()

      const blob =
        await resizer.toBlob(
          workingCanvas,
          'image/jpeg',
          quality / 100
        )

      if (outputUrl) {
        URL.revokeObjectURL(outputUrl)
      }

      const newUrl =
        URL.createObjectURL(blob)

      setOutputUrl(newUrl)

      setOutputInfo({
        width: workingCanvas.width,
        height: workingCanvas.height,
        size: blob.size,
      })

      setProgress(100)
      setStatus('done')
      setStatusText(
        'Ảnh đã xử lý hoàn tất'
      )

      setSlider(50)
    } catch (err) {
      console.error(err)

      setStatus('error')
      setProgress(0)

      setStatusText(
        'Không xử lý được ảnh này. Hãy thử ảnh nhỏ hơn.'
      )
    }
  }

  function reset() {
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl)
    }

    if (outputUrl) {
      URL.revokeObjectURL(outputUrl)
    }

    setFile(null)
    setOriginalUrl('')
    setOutputUrl('')
    setOriginalInfo(null)
    setOutputInfo(null)

    setStatus('idle')
    setStatusText('Chờ hình ảnh')
    setProgress(0)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—'

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`
    }

    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(2)} MB`
  }

  return (
    <main className="page">

      <div className="appShell">

        <header className="topbar">

          <div className="brand">

            <div className="brandIcon">
              P
            </div>

            <div>
              <strong>
                PhotoFlow
              </strong>

              <small>
                AI Image Optimizer
              </small>
            </div>

          </div>

          <div className="headline">

            <h1>
              Làm nét & tối ưu hình ảnh
            </h1>

            <p>
              AI Super Resolution • Natural Photo • Social Preset
            </p>

          </div>

          <div className="privacyBadge">

            <div className="shield">
              ✓
            </div>

            <div>

              <strong>
                Xử lý cục bộ
              </strong>

              <small>
                Không lưu ảnh
              </small>

            </div>

          </div>

        </header>


        <div className="workspace">

          <aside className="sidebar">

            <div
              className="uploadBox"
              onClick={() =>
                inputRef.current?.click()
              }
              onDrop={handleDrop}
              onDragOver={e =>
                e.preventDefault()
              }
            >

              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e =>
                  handleFile(
                    e.target.files?.[0]
                  )
                }
              />

              {!file ? (
                <>

                  <div className="uploadIcon">
                    ↑
                  </div>

                  <h3>
                    Kéo thả ảnh hoặc{' '}
                    <span>
                      Chạm để tải
                    </span>
                  </h3>

                  <p>
                    JPG, JPEG, PNG, WEBP • tối đa 20MB
                  </p>

                  <button
                    className="chooseButton"
                    type="button"
                  >
                    Chọn hình ảnh
                  </button>

                </>
              ) : (
                <>

                  <div className="successIcon">
                    ✓
                  </div>

                  <h3>
                    Ảnh đã sẵn sàng
                  </h3>

                  <div className="fileCard">

                    <img
                      src={originalUrl}
                      alt=""
                    />

                    <div>

                      <strong>
                        {file.name}
                      </strong>

                      <span>
                        {formatSize(
                          file.size
                        )}
                      </span>

                    </div>

                  </div>

                  <small className="replaceText">
                    Nhấn để thay ảnh
                  </small>

                </>
              )}

            </div>


            <div className="controlCard">

              <div className="controlHead">

                <span className="number">
                  1
                </span>

                <div>
                  <strong>
                    Chế độ tối ưu
                  </strong>

                  <small>
                    Natural Photo
                  </small>
                </div>

              </div>

              <div className="selectedMode">

                <span className="spark">
                  ✦
                </span>

                <div>

                  <strong>
                    Natural Photo
                  </strong>

                  <p>
                    Cân màu, giảm highlight gắt và giữ cảm giác tự nhiên.
                  </p>

                </div>

                <span className="modeCheck">
                  ✓
                </span>

              </div>

            </div>


            <div className="controlCard">

              <div className="controlHead">

                <span className="number">
                  2
                </span>

                <div>

                  <strong>
                    AI Upscale
                  </strong>

                  <small>
                    ESRGAN Super Resolution
                  </small>

                </div>

              </div>

              <div className="scaleGrid">

                {[1, 2, 4].map(x => (

                  <button
                    key={x}
                    onClick={() =>
                      setScale(x)
                    }
                    className={
                      scale === x
                        ? 'scale active'
                        : 'scale'
                    }
                  >

                    <strong>
                      {x}×
                    </strong>

                    <span>
                      {x === 1
                        ? 'Gốc'
                        : x === 2
                        ? 'Rõ nét'
                        : 'Siêu nét'}
                    </span>

                  </button>

                ))}

              </div>

            </div>


            <div className="controlCard">

              <div className="controlHead">

                <span className="number">
                  3
                </span>

                <div>
                  <strong>
                    Social Preset
                  </strong>

                  <small>
                    Resize & crop tự động
                  </small>
                </div>

              </div>

              <select
                value={preset}
                onChange={e =>
                  setPreset(
                    e.target.value
                  )
                }
              >

                <option value="original">
                  Giữ nguyên
                </option>

                <option value="fbPortrait">
                  Facebook Post · 1080×1350
                </option>

                <option value="fbSquare">
                  Facebook Ads · 1080×1080
                </option>

                <option value="story">
                  TikTok / Story · 1080×1920
                </option>

                <option value="landscape">
                  Landscape · 1200×628
                </option>

              </select>

              <div className="quality">

                <div>

                  <span>
                    Chất lượng JPEG
                  </span>

                  <b>
                    {quality}%
                  </b>

                </div>

                <input
                  type="range"
                  min="70"
                  max="100"
                  value={quality}
                  onChange={e =>
                    setQuality(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />

              </div>

            </div>


            <button
              className="processButton"
              onClick={processImage}
              disabled={
                !file ||
                status === 'processing'
              }
            >

              {status ===
              'processing'
                ? 'Đang xử lý...'
                : '✦  Khởi chạy xử lý ảnh'}

            </button>

            <div className="privacyNote">
              🔒 Ảnh được xử lý trên trình duyệt
            </div>

          </aside>


          <section className="content">

            <div className="statusCard">

              <div>

                <label>
                  TRẠNG THÁI XỬ LÝ
                </label>

                <h2>
                  {statusText}
                </h2>

                <p>
                  {status ===
                  'processing'
                    ? `Tiến trình ${progress}%`
                    : 'AI Super Resolution + Natural Photo'}
                </p>

              </div>

              <span
                className={`state ${status}`}
              >
                {status === 'done'
                  ? '✓ Hoàn tất'
                  : status ===
                    'processing'
                  ? `${progress}%`
                  : status ===
                    'error'
                  ? 'Có lỗi'
                  : 'Sẵn sàng'}
              </span>

              {status ===
                'processing' && (
                <div className="progress">

                  <div
                    style={{
                      width:
                        progress +
                        '%',
                    }}
                  />

                </div>
              )}

            </div>


            <div className="previewCard">

              {!originalUrl ? (

                <div className="empty">

                  <div className="emptyIcon">
                    ▧
                  </div>

                  <h3>
                    Ảnh xem trước sẽ hiển thị tại đây
                  </h3>

                  <p>
                    Upload ảnh để bắt đầu xử lý.
                  </p>

                </div>

              ) : (

                <>

                  <div className="previewLabels">

                    <span className="originalLabel">
                      GỐC
                    </span>

                    <span className="resultLabel">
                      {outputUrl
                        ? 'ĐÃ XỬ LÝ'
                        : 'PREVIEW'}
                    </span>

                  </div>

                  <div
                    className="comparison"
                    style={{
                      '--position':
                        slider +
                        '%',
                    }}
                  >

                    <img
                      src={
                        outputUrl ||
                        originalUrl
                      }
                      alt=""
                    />

                    {outputUrl && (
                      <>

                        <div className="before">

                          <img
                            src={
                              originalUrl
                            }
                            alt=""
                          />

                        </div>

                        <div className="divider">

                          <span>
                            ‹ ›
                          </span>

                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={
                            slider
                          }
                          onChange={
                            e =>
                              setSlider(
                                e
                                  .target
                                  .value
                              )
                          }
                        />

                      </>
                    )}

                  </div>

                </>
              )}

            </div>


            <div className="stats">

              <div className="statCard">

                <label>
                  ẢNH GỐC
                </label>

                <strong>
                  {originalInfo
                    ? `${originalInfo.width} × ${originalInfo.height}`
                    : '—'}
                </strong>

                <span>
                  {originalInfo
                    ? formatSize(
                        originalInfo.size
                      )
                    : 'Chưa có ảnh'}
                </span>

              </div>


              <div className="statCard">

                <label>
                  ẢNH SAU XỬ LÝ
                </label>

                <strong>
                  {outputInfo
                    ? `${outputInfo.width} × ${outputInfo.height}`
                    : '—'}
                </strong>

                <span>
                  {outputInfo
                    ? formatSize(
                        outputInfo.size
                      )
                    : 'Chưa xử lý'}
                </span>

              </div>


              <div className="statCard">

                <label>
                  ENGINE
                </label>

                <strong>
                  {scale === 1
                    ? 'Pica'
                    : 'ESRGAN'}
                </strong>

                <span>
                  Browser processing
                </span>

              </div>

            </div>


            {outputUrl && (

              <div className="actions">

                <a
                  href={outputUrl}
                  download="photoflow-optimized.jpg"
                  className="download"
                >
                  ↓ Tải ảnh đã xử lý (.jpg)
                </a>

                <button
                  onClick={reset}
                  className="reset"
                >
                  Làm ảnh khác
                </button>

              </div>

            )}

          </section>

        </div>


        <footer>

          <span>
            <b>
              PhotoFlow
            </b>
            {' '}
            · AI Image Optimizer
          </span>

          <span>
            🔒 Local-first
          </span>

        </footer>

      </div>

    </main>
  )
}
