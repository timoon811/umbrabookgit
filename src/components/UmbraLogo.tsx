interface UmbraLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UmbraLogo({ size = "md", className = "" }: UmbraLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`umbra-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: "#7c3aed", stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: "#4338ca", stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: "#1e1b4b", stopOpacity: 1}} />
          </linearGradient>
          <filter id={`shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.1"/>
          </filter>
        </defs>
        
        {/* Background */}
        <rect width="64" height="64" rx="16" fill={`url(#umbra-gradient-${size})`} filter={`url(#shadow-${size})`}/>
        
        {/* Stylized "U" for Umbra */}
        <path 
          d="M20 22 L20 36 Q20 42 26 42 L38 42 Q44 42 44 36 L44 22" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        
        {/* Modern accent */}
        <circle cx="32" cy="50" r="2" fill="white" opacity="0.9"/>
      </svg>
    </div>
  );
}
