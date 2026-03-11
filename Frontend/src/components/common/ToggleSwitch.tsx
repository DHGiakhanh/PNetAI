import { useState } from "react";

export default function ToggleSwitch({ defaultOn = false }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative w-12 h-6 flex items-center rounded-full transition
      ${enabled ? "bg-green-400" : "bg-gray-300"}`}
    >
      <span
        className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition
        ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}