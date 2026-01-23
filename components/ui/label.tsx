import * as React from "react";

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium text-neutral-800 ${className}`} {...props} />;
}
