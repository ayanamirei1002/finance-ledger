/**
 * 模拟 API - 用于 Web 版本
 * 当 Tauri 不可用时使用
 */

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟数据
let mockTransactions: any[] = [
  {
    id: '1',
    book_id: 'book-1',
    category_id: 'cat-1',
    amount: 15000,
    description: '工资收入',
    transaction_date: '2024-01-15',
    transaction_type: 'income',
    counterparty: '公司',
    tags: '工资,月收入',
    notes: '1月份工资',
    created_at: '2024-01-15T10:00:00',
    updated_at: '2024-01-15T10:00:00',
  },
  {
    id: '2',
    book_id: 'book-1',
    category_id: 'cat-2',
    amount: 3500,
    description: '房租支出',
    transaction_date: '2024-01-10',
    transaction_type: 'expense',
    counterparty: '房东',
    tags: '住房,固定支出',
    notes: '1月份房租',
    created_at: '2024-01-10T10:00:00',
    updated_at: '2024-01-10T10:00:00',
  },
  {
    id: '3',
    book_id: 'book-1',
    category_id: 'cat-3',
    amount: 1200,
    description: '餐饮消费',
    transaction_date: '2024-01-12',
    transaction_type: 'expense',
    counterparty: '餐厅',
    tags: '餐饮,日常',
    notes: '聚餐',
    created_at: '2024-01-12T10:00:00',
    updated_at: '2024-01-12T10:00:00',
  },
];

let mockCategories: any[] = [
  { id: 'cat-1', name: '工资薪金', parent_id: null, book_type: 'income', icon: null, sort_order: 1 },
  { id: 'cat-2', name: '住房', parent_id: null, book_type: 'expense', icon: null, sort_order: 1 },
  { id: 'cat-3', name: '餐饮', parent_id: null, book_type: 'expense', icon: null, sort_order: 2 },
  { id: 'cat-4', name: '交通', parent_id: null, book_type: 'expense', icon: null, sort_order: 3 },
  { id: 'cat-5', name: '购物', parent_id: null, book_type: 'expense', icon: null, sort_order: 4 },
  { id: 'cat-6', name: '娱乐', parent_id: null, book_type: 'expense', icon: null, sort_order: 5 },
];

let mockInvoices: any[] = [
  {
    id: 'inv-1',
    invoice_number: '12345678',
    invoice_date: '2024-01-10',
    amount: 1000,
    tax_amount: 130,
    total_amount: 1130,
    seller_name: '科技有限公司',
    buyer_name: '个人',
    invoice_type: '增值税普通发票',
    status: 'matched',
    image_path: null,
    ocr_result: null,
    created_at: '2024-01-10T10:00:00',
    updated_at: '2024-01-10T10:00:00',
  },
];

// 模拟 API 函数
export const mockApi = {
  // 交易记录
  async getTransactions(filter?: any) {
    await delay(300);
    let result = [...mockTransactions];
    
    if (filter?.transaction_type) {
      result = result.filter(t => t.transaction_type === filter.transaction_type);
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(search) ||
        t.counterparty?.toLowerCase().includes(search)
      );
    }
    
    return result;
  },

  async createTransaction(data: any) {
    await delay(200);
    const transaction = {
      ...data,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockTransactions.unshift(transaction);
    return transaction;
  },

  async updateTransaction(id: string, data: any) {
    await delay(200);
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTransactions[index] = { ...mockTransactions[index], ...data, updated_at: new Date().toISOString() };
      return mockTransactions[index];
    }
    throw new Error('Transaction not found');
  },

  async deleteTransaction(id: string) {
    await delay(200);
    mockTransactions = mockTransactions.filter(t => t.id !== id);
  },

  // 分类
  async getCategories(bookType?: string) {
    await delay(200);
    if (bookType) {
      return mockCategories.filter(c => c.book_type === bookType);
    }
    return mockCategories;
  },

  async createCategory(data: any) {
    await delay(200);
    const category = {
      ...data,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
    };
    mockCategories.push(category);
    return category;
  },

  // 发票
  async getInvoices() {
    await delay(300);
    return mockInvoices;
  },

  async createInvoice(data: any) {
    await delay(200);
    const invoice = {
      ...data,
      id: String(Date.now()),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockInvoices.unshift(invoice);
    return invoice;
  },

  async updateInvoice(id: string, data: any) {
    await delay(200);
    const index = mockInvoices.findIndex(i => i.id === id);
    if (index !== -1) {
      mockInvoices[index] = { ...mockInvoices[index], ...data, updated_at: new Date().toISOString() };
      return mockInvoices[index];
    }
    throw new Error('Invoice not found');
  },

  async deleteInvoice(id: string) {
    await delay(200);
    mockInvoices = mockInvoices.filter(i => i.id !== id);
  },

  async updateCategory(id: string, data: any) {
    await delay(200);
    const index = mockCategories.findIndex(c => c.id === id);
    if (index !== -1) {
      mockCategories[index] = { ...mockCategories[index], ...data };
      return mockCategories[index];
    }
    throw new Error('Category not found');
  },

  async deleteCategory(id: string) {
    await delay(200);
    mockCategories = mockCategories.filter(c => c.id !== id);
  },

  // 统计
  async getSummary() {
    await delay(200);
    const totalIncome = mockTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = mockTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      transaction_count: mockTransactions.length,
      invoice_count: mockInvoices.length,
    };
  },

  async getMonthlyStats(_year?: number) {
    await delay(200);
    // 返回模拟的月度数据
    return [
      { month: '2024-01', income: 15000, expense: 4700, balance: 10300 },
      { month: '2024-02', income: 15000, expense: 5200, balance: 9800 },
      { month: '2024-03', income: 16000, expense: 4800, balance: 11200 },
    ];
  },

  async getCategoryStats(_transactionType?: string) {
    await delay(200);
    // 返回模拟的分类数据
    return [
      { category_id: 'cat-2', category_name: '住房', total_amount: 3500, transaction_count: 1, percentage: 74.5 },
      { category_id: 'cat-3', category_name: '餐饮', total_amount: 1200, transaction_count: 1, percentage: 25.5 },
    ];
  },
};