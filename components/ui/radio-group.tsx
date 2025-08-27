"use client";

import * as React from "react";

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  className = "",
  name,
  disabled,
  children,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;
  
  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };
  
  return (
    <div className={`grid gap-2 ${className}`} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childElement = child as React.ReactElement<RadioGroupItemProps>;
          return React.cloneElement(childElement, {
            checked: childElement.props.value === currentValue,
            onChange: () => handleChange(childElement.props.value),
            name,
            disabled: disabled || childElement.props.disabled,
          });
        }
        return child;
      })}
    </div>
  );
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  checked?: boolean;
  onChange?: () => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function RadioGroupItem({
  value,
  id,
  checked,
  onChange,
  className = "",
  name,
  disabled,
  children,
}: RadioGroupItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        value={value}
        id={id || value}
        checked={checked}
        onChange={onChange}
        name={name}
        disabled={disabled}
        className={`h-4 w-4 border-gray-300 text-black focus:ring-black ${className}`}
      />
      {children && (
        <label htmlFor={id || value} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {children}
        </label>
      )}
    </div>
  );
}

export { RadioGroup, RadioGroupItem };