import React from 'react';
import { Link } from 'wouter';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  linkToHome?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', linkToHome = true }) => {
  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl sm:text-3xl',
  };

  const logoContent = (
    <span className={`font-bold ${textSizeClasses[size]}`}>
      <span className="text-forest-800">Noun</span>
      <span className="text-lime-500">Success</span>
    </span>
  );

  if (linkToHome) {
    return <Link href="/">{logoContent}</Link>;
  }

  return logoContent;
};

export default Logo;
