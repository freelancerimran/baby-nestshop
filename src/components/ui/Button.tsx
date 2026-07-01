import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-xl bg-black px-6 py-3 text-white font-semibold transition hover:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}