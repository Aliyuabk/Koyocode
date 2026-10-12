export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  checks: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    symbol: boolean;
  };
};

export function checkPassword(pw: string): PasswordStrength {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label = "Too weak";
  let color = "bg-red-500";

  if (pw.length === 0) {
    score = 0;
    label = "";
    color = "bg-slate-200";
  } else if (passed <= 1) {
    score = 1;
    label = "Weak";
    color = "bg-red-500";
  } else if (passed === 2) {
    score = 2;
    label = "Fair";
    color = "bg-amber-500";
  } else if (passed === 3) {
    score = 3;
    label = "Good";
    color = "bg-blue-500";
  } else {
    score = 4;
    label = "Strong";
    color = "bg-emerald-500";
  }

  return { score, label, color, checks };
}

export function isStrongEnough(pw: string): boolean {
  const { checks } = checkPassword(pw);
  return (
    checks.length && checks.upper && checks.lower && checks.number
  );
}