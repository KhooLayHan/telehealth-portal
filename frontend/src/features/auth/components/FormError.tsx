type FormErrorProps = {
  message: string;
};

export function FormError({ message }: FormErrorProps) {
  return (
    <div
      aria-live="assertive"
      className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive-foreground text-sm"
      role="alert"
    >
      {message}
    </div>
  );
}
