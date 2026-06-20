import React, { useState, useRef, useEffect } from 'react';

export default function LinkActionModal({ marker, onClose, position, setPosition, size }) {
  const modalRef = useRef(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Reset active image when marker changes
  useEffect(() => {
    setActiveImageIndex(0);
    setIsPlaying(false);
  }, [marker]);

  if (!marker || !marker.linkAction || marker.linkAction === 'none') {
    return null;
  }

  const startDrag = (e) => {
    if (e.button !== 0 || !modalRef.current?.contains(e.target)) {
      return;
    }

    // Only allow dragging on the header or drag-bar, not interactive buttons/elements
    if (
      e.target.closest('button') ||
      e.target.closest('video') ||
      e.target.closest('audio') ||
      e.target.closest('iframe') ||
      e.target.closest('.no-drag')
    ) {
      return;
    }

    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = position.x;
    const initialTop = position.y;

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const deltaY = moveEvent.clientY - initialY;
      setPosition({
        x: initialLeft + deltaX,
        y: initialTop + deltaY
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const title = marker.title || marker.tooltip || '联动内容展示';
  const width = size.width || 800;
  const height = size.height || 600;

  // Render text content
  const renderTextContent = () => {
    const text = marker.linkText || '暂无文本内容。请在编辑模式下配置关联动作的文本。';
    return (
      <div 
        className="no-drag"
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#11131c',
          borderRadius: '8px',
          border: '1px solid #1f2335'
        }}
      >
        {text}
      </div>
    );
  };

  // Render image content with custom carousel
  const renderImageContent = () => {
    const images = marker.images || [];
    if (images.length === 0) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#11131c', borderRadius: '8px', border: '1px solid #1f2335' }}>
          <span style={{ color: '#718096' }}>暂无图片。请在编辑模式下配置关联图片。</span>
        </div>
      );
    }

    const handlePrev = () => {
      setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNext = () => {
      setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
      <div className="no-drag" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
        {/* Main Display Frame */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#090a0f', borderRadius: '8px', border: '1px solid #1f2335', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={images[activeImageIndex]} 
            alt={`Slide ${activeImageIndex + 1}`} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'all 0.3s ease' }} 
          />
          
          {images.length > 1 && (
            <>
              <button onClick={handlePrev} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(22, 25, 34, 0.75)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>‹</button>
              <button onClick={handleNext} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(22, 25, 34, 0.75)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>›</button>
            </>
          )}

          {/* Slide Indicator Overlay */}
          <div style={{ position: 'absolute', bottom: '12px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
            {activeImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Bar */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
            {images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImageIndex(idx)}
                style={{ 
                  width: '60px', 
                  height: '45px', 
                  borderRadius: '4px', 
                  overflow: 'hidden', 
                  border: activeImageIndex === idx ? '2px solid #00dfb6' : '1px solid #1f2335',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render video content
  const renderVideoContent = () => {
    const videoUrl = marker.linkVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    return (
      <div className="no-drag" style={{ flex: 1, backgroundColor: '#090a0f', borderRadius: '8px', border: '1px solid #1f2335', overflow: 'hidden' }}>
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          muted 
          loop 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
    );
  };

  // Render audio content with premium vinyl spinner and pulsing visualizer
  const renderAudioContent = () => {
    const audioUrl = marker.linkAudioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    const handleAudioPlay = () => {
      setIsPlaying(true);
    };

    const handleAudioPause = () => {
      setIsPlaying(false);
    };

    return (
      <div className="no-drag" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#11131c', borderRadius: '8px', border: '1px solid #1f2335', padding: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Pulsing Visualizer background bars */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '60px', marginBottom: '24px' }}>
          {[...Array(12)].map((_, i) => {
            const delay = (i * 0.15).toFixed(2);
            const duration = (0.6 + Math.random() * 0.8).toFixed(2);
            return (
              <div 
                key={i}
                style={{
                  width: '6px',
                  height: isPlaying ? '100%' : '8px',
                  backgroundColor: '#00dfb6',
                  borderRadius: '3px',
                  transformOrigin: 'bottom',
                  animation: isPlaying ? `audioWave ${duration}s ease-in-out ${delay}s infinite alternate` : 'none',
                  transition: 'height 0.3s ease'
                }}
              />
            );
          })}
        </div>

        {/* CSS Animation style */}
        <style>{`
          @keyframes audioWave {
            0% { transform: scaleY(0.1); }
            100% { transform: scaleY(1); }
          }
          @keyframes discRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Vinyl record disc representation */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #2e354f 20%, #090a0f 21%, #090a0f 40%, #1a1c24 41%, #1a1c24 60%, #090a0f 61%, #090a0f 100%)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isPlaying ? 'discRotate 6s linear infinite' : 'none',
          marginBottom: '32px',
          position: 'relative'
        }}>
          {/* Center spindle hole label */}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#00dfb6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px' }}>🎵</span>
          </div>
        </div>

        <audio 
          ref={audioRef}
          src={audioUrl} 
          controls 
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onEnded={handleAudioPause}
          style={{ width: '80%', maxWidth: '400px' }} 
        />
      </div>
    );
  };

  // Render high tech map mockup
  const renderFlatMapContent = () => {
    return (
      <div className="no-drag" style={{ flex: 1, backgroundColor: '#0b0c10', borderRadius: '8px', border: '1px solid #1f2335', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
          {/* Map Grid Pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 223, 182, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Radar Circles */}
          <circle cx="400" cy="250" r="180" fill="none" stroke="rgba(0, 223, 182, 0.15)" strokeWidth="1" strokeDasharray="5, 5" />
          <circle cx="400" cy="250" r="100" fill="none" stroke="rgba(0, 223, 182, 0.15)" strokeWidth="1" />
          
          {/* Map Land outline mock */}
          <path d="M150 150 Q 250 80 400 120 T 650 180 T 700 350 T 450 420 T 200 380 Z" fill="none" stroke="rgba(46, 53, 79, 0.6)" strokeWidth="2" />
          <path d="M300 200 Q 350 150 420 180 T 550 250 T 500 380 T 350 350 Z" fill="none" stroke="rgba(46, 53, 79, 0.6)" strokeWidth="1.5" />

          {/* Sweeper Line */}
          <line x1="400" y1="250" x2="570" y2="190" stroke="#00dfb6" strokeWidth="2" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0 400 250" to="360 400 250" dur="8s" repeatCount="indefinite" />
          </line>

          {/* Pulsing Coordinate Dot 1 */}
          <circle cx="350" cy="180" r="6" fill="#00dfb6">
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="180" r="14" fill="none" stroke="#00dfb6" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="r" values="6;22;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Pulsing Coordinate Dot 2 */}
          <circle cx="480" cy="320" r="6" fill="#ff3b30">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="480" cy="320" r="14" fill="none" stroke="#ff3b30" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="r" values="6;22;6" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Center Point */}
          <circle cx="400" cy="250" r="4" fill="#ffffff" />
          <text x="410" y="255" fill="#ffffff" fontSize="12" fontFamily="monospace">调度中心 (CENTER)</text>
          <text x="360" y="170" fill="#00dfb6" fontSize="10" fontFamily="monospace">设备A (ONLINE)</text>
          <text x="490" y="315" fill="#ff3b30" fontSize="10" fontFamily="monospace">警告B (ALARM)</text>
        </svg>

        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(22, 25, 34, 0.85)', padding: '6px 12px', border: '1px solid #2e354f', borderRadius: '4px', fontSize: '11px', color: '#a0aec0', fontFamily: 'monospace' }}>
          STATUS: ACTIVE DISPATCH MAP
        </div>
      </div>
    );
  };

  return (
    <div
      ref={modalRef}
      onPointerDown={startDrag}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: 'rgba(22, 25, 34, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(46, 53, 79, 0.85)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9995,
        overflow: 'hidden',
        boxSizing: 'border-box',
        animation: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header bar */}
      <div 
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(46, 53, 79, 0.5)',
          background: 'rgba(0,0,0,0.15)',
          cursor: 'move',
          height: '52px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>
            {marker.linkAction === 'text' && '📝'}
            {marker.linkAction === 'image' && '🖼️'}
            {marker.linkAction === 'video' && '🎥'}
            {marker.linkAction === 'audio' && '🔊'}
            {marker.linkAction === 'flat_map' && '🗺️'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px', color: '#00dfb6' }}>
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a0aec0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}
          className="close-edit-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body content wrapper */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {marker.linkAction === 'text' && renderTextContent()}
        {marker.linkAction === 'image' && renderImageContent()}
        {marker.linkAction === 'video' && renderVideoContent()}
        {marker.linkAction === 'audio' && renderAudioContent()}
        {marker.linkAction === 'flat_map' && renderFlatMapContent()}
      </div>
    </div>
  );
}
