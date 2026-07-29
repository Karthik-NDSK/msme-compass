import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

/**
 * Toast notification — slides up from bottom, auto-dismisses in 2.5s
 * Per DESIGN.md §6
 */
export default function Toast({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // allow fade-out
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="toast"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      role="alert"
      aria-live="polite"
    >
      <CheckCircle size={16} strokeWidth={1.75} color="#4ade80" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Toast container — manages multiple toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  function showToast(message) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function ToastContainer() {
    return (
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    );
  }

  return { showToast, ToastContainer };
}
