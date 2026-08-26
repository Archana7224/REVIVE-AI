export type RecoveryAccessState = {
  canMutate: boolean;
  label: string;
  description: string;
};

export function getRecoveryAccessState(isAuthenticated: boolean): RecoveryAccessState {
  if (isAuthenticated) {
    return {
      canMutate: true,
      label: "Recovery actions enabled",
      description: "Actions are checked against the merchant policy before execution.",
    };
  }

  return {
    canMutate: false,
    label: "Read-only demo",
    description: "Sign in to create payment links, schedule recovery, or escalate cases.",
  };
}
