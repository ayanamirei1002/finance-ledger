/**
 * API 适配器
 * 自动检测是否在 Tauri 环境中，选择相应的 API 实现
 */

import { mockApi } from '../mock/api';

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Tauri API（如果可用）
let tauriApi: any = null;

// 动态加载 Tauri API
const loadTauriApi = async () => {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      tauriApi = {
        async getTransactions(filter?: any) {
          return invoke('get_transactions', { filter });
        },
        async createTransaction(data: any) {
          return invoke('create_transaction', { request: data });
        },
        async updateTransaction(id: string, data: any) {
          return invoke('update_transaction', { request: { id, ...data } });
        },
        async deleteTransaction(id: string) {
          return invoke('delete_transaction', { id });
        },
        async getCategories(bookType?: string) {
          return invoke('get_categories', { bookType });
        },
        async createCategory(data: any) {
          return invoke('create_category', { request: data });
        },
        async getInvoices() {
          return invoke('get_invoices');
        },
        async createInvoice(data: any) {
          return invoke('create_invoice', { request: data });
        },
        async updateInvoice(id: string, data: any) {
          return invoke('update_invoice', { request: { id, ...data } });
        },
        async deleteInvoice(id: string) {
          return invoke('delete_invoice', { id });
        },
        async updateCategory(id: string, data: any) {
          return invoke('update_category', { request: { id, ...data } });
        },
        async deleteCategory(id: string) {
          return invoke('delete_category', { id });
        },
        async getSummary() {
          return invoke('get_summary');
        },
        async getMonthlyStats(year?: number) {
          return invoke('get_monthly_stats', { year });
        },
        async getCategoryStats(transactionType?: string) {
          return invoke('get_category_stats', { transactionType });
        },
      };
    } catch (error) {
      console.warn('Failed to load Tauri API, falling back to mock API:', error);
    }
  }
};

// 初始化
loadTauriApi();

// 导出 API
export const api = {
  // 交易记录
  async getTransactions(filter?: any) {
    if (tauriApi) {
      return tauriApi.getTransactions(filter);
    }
    return mockApi.getTransactions(filter);
  },

  async createTransaction(data: any) {
    if (tauriApi) {
      return tauriApi.createTransaction(data);
    }
    return mockApi.createTransaction(data);
  },

  async updateTransaction(id: string, data: any) {
    if (tauriApi) {
      return tauriApi.updateTransaction(id, data);
    }
    return mockApi.updateTransaction(id, data);
  },

  async deleteTransaction(id: string) {
    if (tauriApi) {
      return tauriApi.deleteTransaction(id);
    }
    return mockApi.deleteTransaction(id);
  },

  // 分类
  async getCategories(bookType?: string) {
    if (tauriApi) {
      return tauriApi.getCategories(bookType);
    }
    return mockApi.getCategories(bookType);
  },

  async createCategory(data: any) {
    if (tauriApi) {
      return tauriApi.createCategory(data);
    }
    return mockApi.createCategory(data);
  },

  // 发票
  async getInvoices() {
    if (tauriApi) {
      return tauriApi.getInvoices();
    }
    return mockApi.getInvoices();
  },

  async createInvoice(data: any) {
    if (tauriApi) {
      return tauriApi.createInvoice(data);
    }
    return mockApi.createInvoice(data);
  },

  async updateInvoice(id: string, data: any) {
    if (tauriApi) {
      return tauriApi.updateInvoice(id, data);
    }
    return mockApi.updateInvoice(id, data);
  },

  async deleteInvoice(id: string) {
    if (tauriApi) {
      return tauriApi.deleteInvoice(id);
    }
    return mockApi.deleteInvoice(id);
  },

  async updateCategory(id: string, data: any) {
    if (tauriApi) {
      return tauriApi.updateCategory(id, data);
    }
    return mockApi.updateCategory(id, data);
  },

  async deleteCategory(id: string) {
    if (tauriApi) {
      return tauriApi.deleteCategory(id);
    }
    return mockApi.deleteCategory(id);
  },

  // 统计
  async getSummary() {
    if (tauriApi) {
      return tauriApi.getSummary();
    }
    return mockApi.getSummary();
  },

  async getMonthlyStats(year?: number) {
    if (tauriApi) {
      return tauriApi.getMonthlyStats(year);
    }
    return mockApi.getMonthlyStats(year);
  },

  async getCategoryStats(transactionType?: string) {
    if (tauriApi) {
      return tauriApi.getCategoryStats(transactionType);
    }
    return mockApi.getCategoryStats(transactionType);
  },
};