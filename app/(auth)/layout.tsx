import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0f172a]">
      {/* Sanatsal 3D Arka Plan Objeleri (Glassmorphism + Blur) */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[100px] opacity-60 mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-pink-500 to-rose-500 blur-[120px] opacity-60 mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 blur-[80px] opacity-50 mix-blend-screen animate-bounce" style={{ animationDuration: '15s' }} />
      
      {/* Ortadaki Cam (Glassmorphism) Katmanı */}
      <div className="z-10 w-full max-w-xl">
        {children}
      </div>
    </main>
  );
}
