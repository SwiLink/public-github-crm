import { useState, forwardRef } from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={error ? "border-red-500" : ""}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
