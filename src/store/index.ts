import { create } from "zustand";
import { api } from "../api";

interface Transaction {
  id: string;
  book_id: string;
  category_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: string;
  counterparty?: string;
  tags?: string;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  book_type: string;
  icon?: string;
  sort_order: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  seller_name: string;
  buyer_name: string;
  invoice_type: string;
  status: string;
  image_path?: string;
  ocr_result?: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  transaction_count: number;
  invoice_count: number;
}

interface AppState {
  // 数据
  transactions: Transaction[];
  categories: Category[];
  invoices: Invoice[];
  summary: Summary | null;
  
  // 加载状态
  loading: {
    transactions: boolean;
    categories: boolean;
    invoices: boolean;
    summary: boolean;
  };
  
  // 错误信息
  error: {
    transactions: string | null;
    categories: string | null;
    invoices: string | null;
    summary: string | null;
  };
  
  // 操作
  loadTransactions: (filter?: any) => Promise<void>;
  loadCategories: (bookType?: string) => Promise<void>;
  loadInvoices: () => Promise<void>;
  loadSummary: () => Promise<void>;
  
  createTransaction: (data: any) => Promise<Transaction>;
  updateTransaction: (id: string, data: any) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  
  createCategory: (data: any) => Promise<Category>;
  updateCategory: (id: string, data: any) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  createInvoice: (data: any) => Promise<Invoice>;
  updateInvoice: (id: string, data: any) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  // 初始数据
  transactions: [],
  categories: [],
  invoices: [],
  summary: null,
  
  // 初始加载状态
  loading: {
    transactions: false,
    categories: false,
    invoices: false,
    summary: false,
  },
  
  // 初始错误信息
  error: {
    transactions: null,
    categories: null,
    invoices: null,
    summary: null,
  },
  
  // 加载交易记录
  loadTransactions: async (filter?: any) => {
    set((state) => ({
      loading: { ...state.loading, transactions: true },
      error: { ...state.error, transactions: null },
    }));
    
    try {
      const transactions = await api.getTransactions(filter);
      set((state) => ({
        transactions,
        loading: { ...state.loading, transactions: false },
      }));
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, transactions: false },
        error: { ...state.error, transactions: String(error) },
      }));
    }
  },
  
  // 加载分类
  loadCategories: async (bookType?: string) => {
    set((state) => ({
      loading: { ...state.loading, categories: true },
      error: { ...state.error, categories: null },
    }));
    
    try {
      const categories = await api.getCategories(bookType);
      set((state) => ({
        categories,
        loading: { ...state.loading, categories: false },
      }));
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, categories: false },
        error: { ...state.error, categories: String(error) },
      }));
    }
  },
  
  // 加载发票
  loadInvoices: async () => {
    set((state) => ({
      loading: { ...state.loading, invoices: true },
      error: { ...state.error, invoices: null },
    }));
    
    try {
      const invoices = await api.getInvoices();
      set((state) => ({
        invoices,
        loading: { ...state.loading, invoices: false },
      }));
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, invoices: false },
        error: { ...state.error, invoices: String(error) },
      }));
    }
  },
  
  // 加载汇总数据
  loadSummary: async () => {
    set((state) => ({
      loading: { ...state.loading, summary: true },
      error: { ...state.error, summary: null },
    }));
    
    try {
      const summary = await api.getSummary();
      set((state) => ({
        summary,
        loading: { ...state.loading, summary: false },
      }));
    } catch (error) {
      set((state) => ({
        loading: { ...state.loading, summary: false },
        error: { ...state.error, summary: String(error) },
      }));
    }
  },
  
  // 创建交易记录
  createTransaction: async (data: any) => {
    const transaction = await api.createTransaction(data);
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    return transaction;
  },
  
  // 更新交易记录
  updateTransaction: async (id: string, data: any) => {
    const transaction = await api.updateTransaction(id, data);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? transaction : t)),
    }));
    return transaction;
  },
  
  // 删除交易记录
  deleteTransaction: async (id: string) => {
    await api.deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },
  
  // 创建分类
  createCategory: async (data: any) => {
    const category = await api.createCategory(data);
    set((state) => ({
      categories: [...state.categories, category],
    }));
    return category;
  },
  
  // 更新分类
  updateCategory: async (id: string, data: any) => {
    const category = await api.updateCategory(id, data);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? category : c)),
    }));
    return category;
  },
  
  // 删除分类
  deleteCategory: async (id: string) => {
    await api.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
  
  // 创建发票
  createInvoice: async (data: any) => {
    const invoice = await api.createInvoice(data);
    set((state) => ({
      invoices: [invoice, ...state.invoices],
    }));
    return invoice;
  },
  
  // 更新发票
  updateInvoice: async (id: string, data: any) => {
    const invoice = await api.updateInvoice(id, data);
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? invoice : i)),
    }));
    return invoice;
  },
  
  // 删除发票
  deleteInvoice: async (id: string) => {
    await api.deleteInvoice(id);
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== id),
    }));
  },
}));