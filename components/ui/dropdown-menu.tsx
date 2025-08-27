"use client";

import * as React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuOpen = open !== undefined ? open : isOpen;
  
  const handleToggle = () => {
    const newState = !menuOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };
  
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement<DropdownMenuTriggerProps>, { 
              onClick: handleToggle 
            });
          } else if (child.type === DropdownMenuContent) {
            return menuOpen ? child : null;
          }
        }
        return child;
      })}
    </div>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function DropdownMenuTrigger({ children, onClick }: DropdownMenuTriggerProps) {
  return (
    <button onClick={onClick} className="inline-flex justify-center w-full">
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

function DropdownMenuContent({ 
  children, 
  align = "start",
  className = "" 
}: DropdownMenuContentProps) {
  const alignClass = align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <div className={`absolute ${alignClass} z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}>
      <div className="py-1">{children}</div>
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

function DropdownMenuItem({ 
  children, 
  onClick, 
  className = "",
  disabled = false 
}: DropdownMenuItemProps) {
  return (
    <button
      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator() {
  return <hr className="my-1 border-gray-200" />;
}

function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-2 text-sm font-semibold text-gray-900">{children}</div>;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};