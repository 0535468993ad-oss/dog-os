import type { BreedProfile, MonthlyCost } from '../types';

/** The breed's estimated monthly upkeep in ₪: food, insurance with preventive care, and grooming. */
export function monthlyCost(breed: BreedProfile): MonthlyCost {
  const { estimatedMonthlyFoodILS: foodILS, estimatedMonthlyInsuranceAndVetILS: insuranceAndVetILS, estimatedMonthlyGroomingILS: groomingILS } = breed.israeliEconomics;
  return { foodILS, insuranceAndVetILS, groomingILS, totalILS: foodILS + insuranceAndVetILS + groomingILS };
}

/** How far a budget falls short of the upkeep, 0–1 (0 = covered). */
export function budgetShortfall(budgetILS: number, cost: MonthlyCost): number {
  if (cost.totalILS <= 0) return 0;
  return Math.max(0, (cost.totalILS - budgetILS) / cost.totalILS);
}

/** "1,250 ₪" – a thousands separator without relying on Intl (Hermes builds may lack locale data). */
export function formatILS(amount: number): string {
  return `${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ₪`;
}
