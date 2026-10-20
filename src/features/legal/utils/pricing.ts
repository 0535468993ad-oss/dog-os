/** Amount of each installment, rounded to agorot. */
export function perInstallment(totalPrice: number, installments: number): number {
  return Math.round((totalPrice / installments) * 100) / 100;
}

/** An amount in shekels, formatted for Hebrew. */
export function formatIls(amount: number): string {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
}
