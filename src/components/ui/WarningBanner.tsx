'use client';

export default function WarningBanner({ message, onClose }: { message: string, onClose: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-4 text-center z-50 flex justify-between items-center">
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="font-bold text-xl">×</button>
    </div>
  );
}