import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <p className="text-16 font-medium text-gray-600">Loading Defiance Finance...</p>
      </div>
    </div>
  );
}
