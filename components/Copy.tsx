"use client";
import { useState } from "react";

const Copy = ({ title }: { title: string }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(title);
    setHasCopied(true);

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="mt-2 flex items-center justify-center rounded-md p-2 transition-all hover:bg-gray-100"
      title="ID'yi Kopyala"
    >
      {!hasCopied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280" // Şık bir gri tonu
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981" // Kopyalandığında yeşil tik
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </button>
  );
};

export default Copy;