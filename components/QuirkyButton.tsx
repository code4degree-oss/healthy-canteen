import React from 'react';

interface QuirkyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  children: React.ReactNode;
}

export const QuirkyButton: React.FC<QuirkyButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyle = "font-heading uppercase tracking-widest border-3 border-black px-6 py-4 rounded-xl transition-all duration-150 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:-translate-y-1 hover:-translate-x-0.5";
  
  let colorStyle = "";
  
  switch (variant) {
    case 'primary':
      colorStyle = "bg-quirky-green text-black shadow-hard hover:bg-lime-400 hover:shadow-hard-lg";
      break;
    case 'secondary':
      colorStyle = "bg-quirky-yellow text-black shadow-hard hover:bg-yellow-300 hover:shadow-hard-lg";
      break;
    case 'accent':
      colorStyle = "bg-quirky-pink text-white shadow-hard hover:bg-pink-400 hover:shadow-hard-lg";
      break;
  }

  return (
    <button className={`${baseStyle} ${colorStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};