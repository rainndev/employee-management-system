import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FeedbackState = { message?: string; success?: boolean } | undefined;

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function FormFeedback({ state }: { state: FeedbackState }) {
  if (!state?.message && !state?.success) {
    return null;
  }

  if (state.message) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <CheckCircle2Icon />
      <AlertDescription>Saved.</AlertDescription>
    </Alert>
  );
}
