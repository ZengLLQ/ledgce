import React from 'react';

// 1. Starlink A-Frame Roof & Antenna at Sunset / Dusk (Hero Image Replica)
export const HeroRoofGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Dusk Sky Sunset Gradient */}
          <linearGradient id="duskSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#121826" />
            <stop offset="35%" stopColor="#251e22" />
            <stop offset="58%" stopColor="#442a20" />
            <stop offset="78%" stopColor="#22181a" />
            <stop offset="100%" stopColor="#080a0f" />
          </linearGradient>

          {/* Roof Shadow & Shading */}
          <linearGradient id="roofShade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#303846" />
            <stop offset="45%" stopColor="#1a202c" />
            <stop offset="100%" stopColor="#0d1117" />
          </linearGradient>

          {/* Siding Warm Light Shading */}
          <linearGradient id="wallSiding" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8bcc6" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#7c8290" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2a303c" stopOpacity="0.9" />
          </linearGradient>

          {/* Metallic Dish Gradient */}
          <linearGradient id="dishMetal" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FAFAFA" />
            <stop offset="50%" stopColor="#8E95A5" />
            <stop offset="100%" stopColor="#2B3240" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Dusk Glow behind the roof */}
        <ellipse cx="280" cy="340" rx="260" ry="180" fill="#4a2e22" opacity="0.35" filter="url(#glow)" />
        <circle cx="480" cy="180" r="140" fill="#2d3748" opacity="0.3" filter="url(#glow)" />

        {/* Starlink Satellite Antenna Mounted on Roof Peak */}
        <g transform="translate(380, 100)">
          {/* Dish Mount Arm */}
          <path d="M40 70 L55 110 L68 110 L52 70 Z" fill="#1A202C" />
          <path d="M45 85 L25 105 L28 108 L48 88 Z" fill="#2D3748" />

          {/* Dish Base Flange */}
          <ellipse cx="60" cy="110" rx="14" ry="4" fill="#0D1117" />
          <ellipse cx="60" cy="109" rx="12" ry="3" fill="#4A5568" />

          {/* Dish Rectangular Phased-Array Surface (angled toward sky) */}
          <path
            d="M -10 20 L 75 0 L 85 45 L 0 65 Z"
            fill="url(#dishMetal)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          {/* Dish Edge Bevel */}
          <path d="M -10 20 L 0 65 L 4 67 L -6 22 Z" fill="#1A202C" />
          <path d="M 0 65 L 85 45 L 87 48 L 4 67 Z" fill="#111620" />

          {/* Signal Pulse Beacon Dot */}
          <circle cx="36" cy="32" r="3" fill="#00D26A" />
          <circle cx="36" cy="32" r="8" fill="#00D26A" opacity="0.4" />
        </g>

        {/* Modern A-Frame House Roofline */}
        {/* Main Triangle Gable Wall */}
        <polygon points="460,190 280,480 640,480" fill="url(#wallSiding)" />

        {/* Left Roof Slant Overhang (Dark Shadowed) */}
        <polygon points="460,180 260,490 290,495 470,188" fill="#111620" />
        <polygon points="470,188 290,495 305,498 480,195" fill="url(#roofShade)" />

        {/* Right Roof Slant Overhang */}
        <polygon points="460,180 660,490 640,495 450,188" fill="#161B24" />

        {/* Siding Horizontal Grooves */}
        <line x1="320" y1="420" x2="600" y2="420" stroke="#1F2633" strokeWidth="2" opacity="0.6" />
        <line x1="350" y1="370" x2="570" y2="370" stroke="#1F2633" strokeWidth="2" opacity="0.6" />
        <line x1="380" y1="320" x2="540" y2="320" stroke="#1F2633" strokeWidth="2" opacity="0.6" />
        <line x1="410" y1="270" x2="510" y2="270" stroke="#1F2633" strokeWidth="2" opacity="0.6" />

        {/* Subtle Architectural Lighting Reflection */}
        <ellipse cx="460" cy="360" rx="90" ry="120" fill="#ffffff" opacity="0.08" filter="url(#glow)" />
      </svg>
    </div>
  );
};

// 2. Starlink V4 Hardware Spotlight (Metallic Dish + Router Render)
export const HardwareSpotlightGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 500 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        <defs>
          <linearGradient id="metalPlate" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#CBD5E1" />
            <stop offset="60%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="routerBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="60%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <radialGradient id="greyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4B5563" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#1F2937" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Radial Dark Grey Ambient Reflection */}
        <ellipse cx="260" cy="190" rx="200" ry="110" fill="url(#greyGlow)" />

        {/* Ground Shadow & Table Horizon Line */}
        <ellipse cx="260" cy="245" rx="190" ry="25" fill="#05070A" opacity="0.8" />
        <line x1="50" y1="240" x2="470" y2="240" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Starlink Wi-Fi Router (Left) */}
        <g transform="translate(140, 140)">
          {/* Router Shadow */}
          <ellipse cx="20" cy="98" rx="28" ry="8" fill="#000000" opacity="0.6" />
          {/* Minimalist Vertical Router Tower */}
          <polygon points="0,20 20,0 38,5 24,96 6,96" fill="url(#routerBody)" />
          {/* Sleek White Status LED */}
          <line x1="10" y1="85" x2="14" y2="85" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          {/* Subtle Reflection */}
          <polygon points="6,96 24,96 26,115 4,115" fill="url(#routerBody)" opacity="0.15" />
        </g>

        {/* Starlink Standard Phased-Array Dish (Right) */}
        <g transform="translate(200, 100)">
          {/* Dish Leg Kickstand */}
          <path d="M45 110 L95 140 L115 140 L60 105 Z" fill="#1E293B" />
          <ellipse cx="105" cy="140" rx="18" ry="4" fill="#0B0F17" />

          {/* Dish Surface Platter (Tilted Wedge) */}
          <polygon
            points="20,105 210,50 250,75 55,130"
            fill="url(#metalPlate)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Beveled Edge */}
          <polygon points="20,105 55,130 55,136 20,111" fill="#0F172A" />
          <polygon points="55,130 250,75 250,80 55,136" fill="#0A0E17" />

          {/* Specular Edge Highlight */}
          <line x1="20" y1="105" x2="210" y2="50" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.75" />

          {/* Reflective Mirror Image on Table Surface */}
          <g opacity="0.2" transform="scale(1, -0.4) translate(0, -380)">
            <polygon points="20,105 210,50 250,75 55,130" fill="url(#metalPlate)" />
          </g>
        </g>
      </svg>
    </div>
  );
};

// 3. Storm & Resilient Banner (Dish Facing Tempest Clouds & Rain)
export const ResilientStormGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="stormSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2B3E" />
            <stop offset="40%" stopColor="#131B29" />
            <stop offset="70%" stopColor="#0B1019" />
            <stop offset="100%" stopColor="#05080E" />
          </linearGradient>

          <linearGradient id="dishStormMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A9BB5" />
            <stop offset="60%" stopColor="#3A485E" />
            <stop offset="100%" stopColor="#17202E" />
          </linearGradient>
        </defs>

        {/* Deep Tempest Background */}
        <rect width="600" height="400" fill="url(#stormSky)" />

        {/* Atmospheric Blue Lightning / Thunder Cloud Glow */}
        <circle cx="480" cy="120" r="160" fill="#3874FF" opacity="0.15" />
        <ellipse cx="200" cy="80" rx="180" ry="100" fill="#2A3850" opacity="0.3" />

        {/* Heavy Rain Streaks (Angled 45 deg) */}
        <g stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round">
          <line x1="80" y1="40" x2="120" y2="140" />
          <line x1="140" y1="20" x2="180" y2="120" />
          <line x1="220" y1="50" x2="260" y2="150" />
          <line x1="310" y1="10" x2="350" y2="110" />
          <line x1="390" y1="40" x2="430" y2="140" />
          <line x1="470" y1="20" x2="510" y2="120" />
          <line x1="530" y1="60" x2="570" y2="160" />

          <line x1="60" y1="180" x2="100" y2="280" opacity="0.6" />
          <line x1="150" y1="160" x2="190" y2="260" opacity="0.6" />
          <line x1="240" y1="190" x2="280" y2="290" opacity="0.6" />
          <line x1="340" y1="170" x2="380" y2="270" opacity="0.6" />
          <line x1="450" y1="180" x2="490" y2="280" opacity="0.6" />
          <line x1="520" y1="210" x2="560" y2="310" opacity="0.6" />
        </g>

        {/* Sturdy Industrial Roof Beam & Dish Mount */}
        <g transform="translate(320, 160)">
          {/* Heavy Steel Bracket Beam */}
          <polygon points="120,120 180,80 190,86 130,126" fill="#1C2430" />
          <polygon points="180,80 230,120 220,126 175,86" fill="#121822" />

          {/* Pivot Flange */}
          <circle cx="180" cy="83" r="14" fill="#2E3C4E" stroke="rgba(255,255,255,0.2)" />
          <circle cx="180" cy="83" r="6" fill="#0F141C" />

          {/* Phased Array Dish Battling Rain */}
          <polygon
            points="0,35 160,-20 195,15 35,70"
            fill="url(#dishStormMetal)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <polygon points="0,35 35,70 35,76 0,41" fill="#0D1219" />
          <polygon points="35,70 195,15 195,21 35,76" fill="#080C12" />

          {/* Rain Water Droplets Specular Sheen */}
          <circle cx="70" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="110" cy="15" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="140" cy="5" r="1.5" fill="#FFFFFF" opacity="0.8" />
          <circle cx="100" cy="40" r="2" fill="#FFFFFF" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};

// 4. Remote Landscape & Countryside Pergola (Golden Hour Dusk)
export const RemoteLandscapeGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 600 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="goldenDuskSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1C2433" />
            <stop offset="40%" stopColor="#2E2833" />
            <stop offset="65%" stopColor="#4A342B" />
            <stop offset="85%" stopColor="#2F2321" />
            <stop offset="100%" stopColor="#0E1218" />
          </linearGradient>

          <linearGradient id="mountainRidge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2F3846" />
            <stop offset="100%" stopColor="#10151E" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="600" height="350" fill="url(#goldenDuskSky)" />

        {/* Distant Mountain Silhouettes */}
        <polygon points="0,220 120,160 220,200 340,140 480,190 600,150 600,350 0,350" fill="url(#mountainRidge)" opacity="0.5" />
        <polygon points="0,260 90,210 190,250 280,195 410,240 540,200 600,230 600,350 0,350" fill="#131922" />

        {/* Countryside Pergola Roof with Dish */}
        <g transform="translate(180, 180)">
          {/* Pergola Beams */}
          <rect x="-80" y="80" width="300" height="12" fill="#242B36" />
          <rect x="-60" y="92" width="14" height="80" fill="#171D25" />
          <rect x="70" y="92" width="14" height="80" fill="#171D25" />
          <rect x="200" y="92" width="14" height="80" fill="#171D25" />

          {/* Dish Mount on Beam */}
          <path d="M-10 80 L-10 40 L-6 40 L-6 80 Z" fill="#333E4D" />
          {/* Dish Platter */}
          <polygon points="-40,30 25,12 40,24 -25,42" fill="#E2E8F0" stroke="rgba(255,255,255,0.4)" />
          <polygon points="-40,30 -25,42 -25,46 -40,34" fill="#334155" />
          <polygon points="-25,42 40,24 40,28 -25,46" fill="#1E293B" />
        </g>
      </svg>
    </div>
  );
};
