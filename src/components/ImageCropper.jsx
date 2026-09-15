import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'react-toastify'

// Crop Result তৈরি করার Utility Function
const createCroppedImage = async (imageSrc, pixelCrop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // High-Quality Output (Max 1200px)
  const MAX_SIZE = 1200
  let outputWidth = pixelCrop.width
  let outputHeight = pixelCrop.height

  if (outputWidth > MAX_SIZE || outputHeight > MAX_SIZE) {
    if (outputWidth > outputHeight) {
      outputHeight = Math.round((outputHeight * MAX_SIZE) / outputWidth)
      outputWidth = MAX_SIZE
    } else {
      outputWidth = Math.round((outputWidth * MAX_SIZE) / outputHeight)
      outputHeight = MAX_SIZE
    }
  }

  canvas.width = outputWidth
  canvas.height = outputHeight

  // High Quality Drawing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, outputWidth, outputHeight)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return canvas.toDataURL('image/jpeg', 0.9)
}

function ImageCropper({ imageSrc, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspect, setAspect] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = (crop) => setCrop(crop)
  const onZoomChange = (zoom) => setZoom(zoom)
  const onRotationChange = (rotation) => setRotation(rotation)

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please adjust crop area.')
      return
    }
    try {
      const croppedImage = await createCroppedImage(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImage)
      toast.success('✂️ Image cropped successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to crop image.')
    }
  }

  return (
    <div className="image-cropper-modal">
      <div className="image-cropper-content">
        <div className="cropper-header">
          <h2>✂️ Crop Your Image</h2>
          <button className="cropper-close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="cropper-controls">
          <div className="cropper-control-group">
            <label>Aspect Ratio</label>
            <div className="aspect-buttons">
              <button 
                className={aspect === 1 ? 'aspect-btn active' : 'aspect-btn'}
                onClick={() => setAspect(1)}
              >1:1</button>
              <button 
                className={aspect === 4/3 ? 'aspect-btn active' : 'aspect-btn'}
                onClick={() => setAspect(4/3)}
              >4:3</button>
              <button 
                className={aspect === 16/9 ? 'aspect-btn active' : 'aspect-btn'}
                onClick={() => setAspect(16/9)}
              >16:9</button>
            </div>
          </div>

          <div className="cropper-control-group">
            <label>Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="cropper-slider"
            />
          </div>

          <div className="cropper-control-group">
            <label>Rotate: {rotation}°</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="cropper-slider"
            />
          </div>
        </div>

        <div className="cropper-actions">
          <button className="cropper-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="cropper-save-btn" onClick={handleSave}>✂️ Crop & Save</button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper