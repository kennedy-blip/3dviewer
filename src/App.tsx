import { useState, useRef, useEffect, useCallback } from 'react';

interface Hotspot {
  id: string;
  label: string;
  description: string;
  position: { x: number; y: number; z: number };
  rotationRange: [number, number];
}

interface ColorVariant {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

const colorVariants: ColorVariant[] = [
  { id: 'midnight', name: 'Midnight Black', primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', glow: '#e94560' },
  { id: 'arctic', name: 'Arctic White', primary: '#f8f9fa', secondary: '#e9ecef', accent: '#dee2e6', glow: '#4cc9f0' },
  { id: 'sunset', name: 'Sunset Orange', primary: '#ff6b35', secondary: '#f7c59f', accent: '#efefd0', glow: '#ff006e' },
  { id: 'forest', name: 'Forest Green', primary: '#2d6a4f', secondary: '#40916c', accent: '#52b788', glow: '#95d5b2' },
  { id: 'royal', name: 'Royal Purple', primary: '#7209b7', secondary: '#560bad', accent: '#480ca8', glow: '#f72585' },
];

const hotspots: Hotspot[] = [
  { id: '1', label: 'Premium Driver', description: '40mm neodymium drivers deliver crystal-clear highs and deep bass response up to 20Hz', position: { x: 0, y: -20, z: 80 }, rotationRange: [-45, 45] },
  { id: '2', label: 'Touch Controls', description: 'Intuitive touch surface for play/pause, skip tracks, and volume adjustment', position: { x: 70, y: 0, z: 30 }, rotationRange: [30, 120] },
  { id: '3', label: 'Memory Foam', description: 'Adaptive memory foam cushions conform to your ears for all-day comfort', position: { x: -70, y: 10, z: 30 }, rotationRange: [-120, -30] },
  { id: '4', label: 'USB-C Charging', description: 'Fast charging via USB-C - 10 minutes for 3 hours of playback', position: { x: 0, y: 60, z: 0 }, rotationRange: [150, 210] },
];

function App() {
  const [rotation, setRotation] = useState({ x: -15, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorVariant>(colorVariants[0]);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const lastPosition = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;
    setRotation(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(2, prev - e.deltaY * 0.001)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsAutoRotating(false);
    lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - lastPosition.current.x;
    const deltaY = e.touches[0].clientY - lastPosition.current.y;
    setRotation(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotation(prev => ({ ...prev, y: prev.y + 0.3 }));
    }, 16);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const normalizedY = ((rotation.y % 360) + 360) % 360;

  const isHotspotVisible = (hotspot: Hotspot) => {
    const [min, max] = hotspot.rotationRange;
    if (min < 0 && max > 0) {
      return normalizedY >= (360 + min) || normalizedY <= max;
    }
    if (min >= 0 && max >= 0) {
      return normalizedY >= min && normalizedY <= max;
    }
    return normalizedY >= (360 + min) && normalizedY <= (360 + max);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Nova <span style={{ color: selectedColor.glow }}>Pro</span> Headphones
        </h1>
        <p className="text-slate-400 text-sm md:text-base">Drag to rotate • Scroll to zoom • Click hotspots for details</p>
      </div>

      {/* Main Viewer */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-2xl aspect-square cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* 3D Scene */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative w-64 h-64 md:w-80 md:h-80 transition-transform duration-100"
            style={{
              transformStyle: 'preserve-3d',
              transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            }}
          >
            {/* Headphone - Left Ear Cup */}
            <div
              className="absolute rounded-full shadow-2xl"
              style={{
                width: '120px',
                height: '140px',
                background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)`,
                transform: 'translateX(-80px) translateZ(20px)',
                left: '50%',
                top: '50%',
                marginTop: '-70px',
                marginLeft: '-60px',
                boxShadow: `0 0 40px ${selectedColor.glow}40, inset 0 0 20px rgba(255,255,255,0.1)`,
              }}
            >
              {/* Driver */}
              <div 
                className="absolute rounded-full"
                style={{
                  width: '80px',
                  height: '80px',
                  background: `radial-gradient(circle, ${selectedColor.accent} 0%, ${selectedColor.primary} 70%)`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `inset 0 0 30px rgba(0,0,0,0.5), 0 0 10px ${selectedColor.glow}60`,
                }}
              >
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '30px',
                    height: '30px',
                    background: selectedColor.glow,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 20px ${selectedColor.glow}`,
                  }}
                />
              </div>
              {/* Cushion */}
              <div 
                className="absolute rounded-full"
                style={{
                  width: '130px',
                  height: '150px',
                  border: `8px solid ${selectedColor.secondary}`,
                  top: '-5px',
                  left: '-5px',
                  background: 'transparent',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
                }}
              />
            </div>

            {/* Headphone - Right Ear Cup */}
            <div
              className="absolute rounded-full shadow-2xl"
              style={{
                width: '120px',
                height: '140px',
                background: `linear-gradient(225deg, ${selectedColor.primary} 0%, ${selectedColor.secondary} 100%)`,
                transform: 'translateX(80px) translateZ(20px)',
                left: '50%',
                top: '50%',
                marginTop: '-70px',
                marginLeft: '-60px',
                boxShadow: `0 0 40px ${selectedColor.glow}40, inset 0 0 20px rgba(255,255,255,0.1)`,
              }}
            >
              {/* Driver */}
              <div 
                className="absolute rounded-full"
                style={{
                  width: '80px',
                  height: '80px',
                  background: `radial-gradient(circle, ${selectedColor.accent} 0%, ${selectedColor.primary} 70%)`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `inset 0 0 30px rgba(0,0,0,0.5), 0 0 10px ${selectedColor.glow}60`,
                }}
              >
                <div 
                  className="absolute rounded-full"
                  style={{
                    width: '30px',
                    height: '30px',
                    background: selectedColor.glow,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 20px ${selectedColor.glow}`,
                  }}
                />
              </div>
              {/* Touch Surface Indicator */}
              <div 
                className="absolute"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedColor.glow}50`,
                  top: '20px',
                  right: '10px',
                }}
              />
            </div>

            {/* Headband */}
            <div
              className="absolute"
              style={{
                width: '200px',
                height: '100px',
                borderRadius: '100px 100px 0 0',
                border: `12px solid ${selectedColor.primary}`,
                borderBottom: 'none',
                left: '50%',
                top: '50%',
                marginLeft: '-100px',
                marginTop: '-130px',
                transform: 'translateZ(0px)',
                boxShadow: `0 -10px 30px ${selectedColor.glow}30`,
              }}
            >
              {/* Inner headband padding */}
              <div
                className="absolute"
                style={{
                  width: '160px',
                  height: '20px',
                  borderRadius: '10px',
                  background: `linear-gradient(90deg, ${selectedColor.secondary}, ${selectedColor.accent}, ${selectedColor.secondary})`,
                  left: '50%',
                  top: '20px',
                  marginLeft: '-80px',
                }}
              />
            </div>

            {/* Connectors */}
            <div
              className="absolute"
              style={{
                width: '20px',
                height: '60px',
                background: `linear-gradient(180deg, ${selectedColor.secondary}, ${selectedColor.primary})`,
                borderRadius: '10px',
                left: '50%',
                top: '50%',
                marginLeft: '-90px',
                marginTop: '-60px',
                transform: 'translateZ(10px)',
              }}
            />
            <div
              className="absolute"
              style={{
                width: '20px',
                height: '60px',
                background: `linear-gradient(180deg, ${selectedColor.secondary}, ${selectedColor.primary})`,
                borderRadius: '10px',
                left: '50%',
                top: '50%',
                marginLeft: '70px',
                marginTop: '-60px',
                transform: 'translateZ(10px)',
              }}
            />

            {/* Hotspots */}
            {hotspots.map((hotspot) => (
              <div
                key={hotspot.id}
                className={`absolute transition-all duration-300 ${isHotspotVisible(hotspot) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate3d(${hotspot.position.x}px, ${hotspot.position.y}px, ${hotspot.position.z}px)`,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id);
                  }}
                  className="relative group"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse"
                    style={{ 
                      background: selectedColor.glow,
                      boxShadow: `0 0 20px ${selectedColor.glow}`,
                    }}
                  >
                    +
                  </div>
                  <div 
                    className="absolute w-10 h-10 rounded-full -top-2 -left-2 animate-ping"
                    style={{ 
                      background: `${selectedColor.glow}30`,
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot Info Panel */}
        {activeHotspot && (
          <div 
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 animate-fade-in"
          >
            <button 
              onClick={() => setActiveHotspot(null)}
              className="absolute top-2 right-2 text-white/60 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-white font-bold mb-2" style={{ color: selectedColor.glow }}>
              {hotspots.find(h => h.id === activeHotspot)?.label}
            </h3>
            <p className="text-slate-300 text-sm">
              {hotspots.find(h => h.id === activeHotspot)?.description}
            </p>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(2, prev + 0.2))}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
          <div className="text-center text-white/60 text-xs py-1">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors flex items-center justify-center text-xl font-bold"
          >
            −
          </button>
        </div>

        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          className={`absolute left-4 top-4 px-4 py-2 rounded-full text-sm transition-all ${
            isAutoRotating 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-white/60'
          } backdrop-blur-sm hover:bg-white/30`}
        >
          {isAutoRotating ? '⟳ Auto Rotating' : '⏸ Paused'}
        </button>

        {/* Rotation Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white/60 text-xs">Rotation:</span>
            <span className="text-white font-mono text-sm">{Math.round(normalizedY)}°</span>
          </div>
        </div>
      </div>

      {/* Color Variants */}
      <div className="mt-8 flex flex-col items-center">
        <h3 className="text-white/60 text-sm mb-3">Select Color</h3>
        <div className="flex gap-3 flex-wrap justify-center">
          {colorVariants.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color)}
              className={`group relative flex flex-col items-center transition-transform hover:scale-110 ${
                selectedColor.id === color.id ? 'scale-110' : ''
              }`}
            >
              <div 
                className={`w-12 h-12 rounded-full shadow-lg transition-all ${
                  selectedColor.id === color.id 
                    ? 'ring-2 ring-offset-2 ring-offset-slate-900' 
                    : ''
                }`}
                style={{ 
                  background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                  boxShadow: selectedColor.id === color.id ? `0 0 20px ${color.glow}` : 'none'
                }}
              />
              <span className={`text-xs mt-2 transition-colors ${
                selectedColor.id === color.id ? 'text-white' : 'text-white/50'
              }`}>
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
        {[
          { icon: '🎵', label: 'Hi-Res Audio' },
          { icon: '🔋', label: '40hr Battery' },
          { icon: '🎤', label: 'Active NC' },
          { icon: '📱', label: 'Bluetooth 5.3' },
        ].map((feature) => (
          <div 
            key={feature.label}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <div className="text-white/80 text-sm">{feature.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button 
        className="mt-8 px-8 py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105 active:scale-95"
        style={{ 
          background: `linear-gradient(135deg, ${selectedColor.glow}, ${selectedColor.primary})`,
          boxShadow: `0 10px 40px ${selectedColor.glow}50`
        }}
      >
        Pre-Order Now — $349
      </button>
    </div>
  );
}

export default App;
