import { ui } from "../lib/ui";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-sm font-semibold text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          className={`${ui.btn} ${ui.btnSm} mt-3`}
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
