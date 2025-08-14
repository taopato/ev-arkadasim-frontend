// House entity model
export interface House {
  id: number;
  name: string;
  creatorUserId: number;
  createdAt?: string;
  updatedAt?: string;
  members?: HouseMember[];
}

// House member model
export interface HouseMember {
  id: number;
  fullName: string;
  email: string;
  joinedAt?: string;
}

// House summary for list views
export interface HouseSummary {
  id: number;
  name: string;
  memberCount: number;
  totalExpenses?: number;
  lastActivity?: string;
}

// House invitation model
export interface HouseInvitation {
  id: number;
  houseId: number;
  email: string;
  invitationCode: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt?: string;
}

// House spending overview model
export interface HouseSpendingOverview {
  houseId: number;
  totalSpending: number;
  recentExpenses: ExpenseSummary[];
  memberDebts: MemberDebt[];
}

// Expense summary for overview
export interface ExpenseSummary {
  id: number;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
  paidBy: string;
}

// Member debt model
export interface MemberDebt {
  userId: number;
  fullName: string;
  debt: number;
  receivable: number;
  balance: number;
}
