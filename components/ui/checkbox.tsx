import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded-md border border-[#d6d6e7] bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50 checked:bg-[#4F46E5] checked:border-[#4F46E5]",
            className
          )}
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <Check 
          className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity pointer-events-none peer-checked:opacity-100" 
          strokeWidth={4}
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
