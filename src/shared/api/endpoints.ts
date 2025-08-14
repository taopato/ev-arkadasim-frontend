// API endpoint'leri için yardımcı sabitler
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/Auth/Login',
    sendVerificationCode: '/Auth/SendVerificationCode',
    verifyCodeAndRegister: '/Auth/VerifyCodeAndRegister',
    verifyCodeForReset: '/Auth/VerifyCodeForReset',
    resetPassword: '/Auth/ResetPassword',
  },

  // Houses endpoints
  houses: {
    getAll: '/Houses',
    create: '/Houses',
    getById: (id: string | number) => `/Houses/${id}`,
    addMember: (id: string | number) => `/Houses/${id}/members`,
    removeMember: (id: string | number, userId: string | number) => `/Houses/${id}/members/${userId}`,
    sendInvitation: (houseId: string | number) => `/Houses/${houseId}/invitations`,
    acceptInvitation: '/Houses/AcceptInvitation',
    getMembers: (houseId: string | number) => `/Houses/${houseId}/members`,
    getUserDebts: (userId: string | number, houseId: string | number) => `/Houses/GetUserDebts/${userId}/${houseId}`,
    getUserReceivables: (userId: string | number, houseId: string | number) => `/Houses/GetUserReceivables/${userId}/${houseId}`,
    getUserHouses: (userId: string | number) => `/Houses/GetUserHouses/${userId}`,
    spendingOverview: (houseId: string | number, from?: string, to?: string, recentLimit?: number) => 
      `/Houses/${houseId}/spending-overview?from=${from || ''}&to=${to || ''}&recentLimit=${recentLimit || ''}`,
  },

  // Expenses endpoints
  expenses: {
    getAll: '/Expenses',
    create: '/Expenses',
    addExpense: '/Expenses/AddExpense',
    getByHouse: (houseId: string | number) => `/Expenses/GetExpenses/${houseId}`,
    getById: (expenseId: string | number) => `/Expenses/GetExpense/${expenseId}`,
    delete: (expenseId: string | number) => `/Expenses/DeleteExpense/${expenseId}`,
    update: (expenseId: string | number) => `/Expenses/UpdateExpense/${expenseId}`,
  },

  // Bills endpoints
  bills: {
    create: '/Bills',
    finalize: (billId: string | number) => `/Bills/${billId}/finalize`,
    uploadDocument: (billId: string | number) => `/Bills/${billId}/documents`,
    getRecent: (houseId: string | number, take?: number) => `/Bills/recent?houseId=${houseId}&take=${take || 10}`,
    getByHouse: (houseId: string | number) => `/Bills/GetBills/${houseId}`,
    getByHouseAndType: (houseId: string | number, utilityType: string | number) => `/Bills/GetBills/${houseId}?utilityType=${utilityType}`,
    getById: (billId: string | number) => `/Bills/GetBill/${billId}`,
    delete: (billId: string | number) => `/Bills/DeleteBill/${billId}`,
    update: (billId: string | number) => `/Bills/UpdateBill/${billId}`,
  },

  // Payments endpoints
  payments: {
    create: '/Payments/CreatePayment',
    getByHouse: (houseId: string | number) => `/Payments/GetPayments/${houseId}`,
    getPendingPayments: (userId: string | number) => `/Payments/GetPendingPayments/${userId}`,
    approvePayment: (paymentId: string | number) => `/Payments/ApprovePayment/${paymentId}`,
    rejectPayment: (paymentId: string | number) => `/Payments/RejectPayment/${paymentId}`,
    addPaymentWithAllocations: '/Payments/AddPaymentWithAllocations',
  },

  // Recurring charges (contracts & cycles)
  charges: {
    list: (houseId: string | number, period: string) => `/Charges?houseId=${houseId}&period=${encodeURIComponent(period)}`,
    setBill: (cycleId: string | number) => `/Charges/${cycleId}/SetBill`,
    markPaid: (cycleId: string | number) => `/Charges/${cycleId}/MarkPaid`,
  },
  recurringCharges: {
    create: '/RecurringCharges',
  },

  // Users endpoints
  users: {
    getAll: '/Users',
    create: '/Users',
    getAllUsers: '/Users/GetAllUsers',
    getById: (userId: string | number) => `/Users/${userId}`,
    paymentHistory: (userId: string | number) => `/Users/${userId}/payment-history`,
  },
};
