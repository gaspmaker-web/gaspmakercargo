"use client";
import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  onValueChange?: (v: string) => void;
  value?: string;
};

export function Select({ children, onValueChange, value, className = "", ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 ${className}`}
      value={value}onChange={(e) => onValueChange?.(e.target.value)} 
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
export function SelectValue(_props: { placeholder?: string }) { return null; }
export function SelectContent({ children }: { children?: React.ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}