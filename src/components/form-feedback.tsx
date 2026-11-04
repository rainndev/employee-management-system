import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FeedbackState = { message?: string; success?: boolean } | undefined;

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p role="alert" className="text-sm text-destructive">
      {messages[0]}
    </p>
  );
}

export function FormFeedback({ state }: { state: FeedbackState }) {
  if (!state?.message && !state?.success) {
    return null;
  }

  if (state.message) {
    return (
      <Alert variant="destructive" aria-live="polite">
        <AlertCircleIcon />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert aria-live="polite">
      <CheckCircle2Icon />
      <AlertDescription>Saved.</AlertDescription>
    </Alert>
  );
}
