'use client';
import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>){
  const { className="", disabled, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium " +
        "border-neutral-200 bg-black text-white hover:bg-neutral-800 " +
        "disabled:opacity-50 disabled:cursor-not-allowed transition " + className
      }
    />
  );
}

export default Button;
