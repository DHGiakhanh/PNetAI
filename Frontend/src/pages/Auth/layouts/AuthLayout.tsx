import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-warm via-warm to-cream flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-sand bg-white/85 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        {children}
      </div>
    </div>
  );
};
