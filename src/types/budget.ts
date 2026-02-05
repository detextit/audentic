export interface UserBudget {
  userId: string;
  totalBudget: number;
  usedAmount: number;
  lastUpdated: Date;
  nextRefreshDate: Date;
  planType: "free" | "byok";
  openaiApiKey: string;
}

export const TRIAL_BUDGET = 5.0;
export const TRIAL_REFRESH_DAYS = 30;

export const NEW_USER_BUDGET: Partial<UserBudget> = {
  totalBudget: TRIAL_BUDGET,
  usedAmount: 0,
  planType: "free",
  openaiApiKey: "",
};
