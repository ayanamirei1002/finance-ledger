use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 账簿类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AccountBookType {
    /// 收入
    Income,
    /// 支出
    Expense,
    /// 转账
    Transfer,
}

impl AccountBookType {
    pub fn as_str(&self) -> &'static str {
        match self {
            AccountBookType::Income => "income",
            AccountBookType::Expense => "expense",
            AccountBookType::Transfer => "transfer",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "income" => Some(AccountBookType::Income),
            "expense" => Some(AccountBookType::Expense),
            "transfer" => Some(AccountBookType::Transfer),
            _ => None,
        }
    }
}

/// 账簿
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountBook {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub book_type: AccountBookType,
    pub currency: String,
    pub is_default: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

/// 科目分类
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub book_type: AccountBookType,
    pub icon: Option<String>,
    pub sort_order: i32,
    pub created_at: NaiveDateTime,
}

/// 交易记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub book_id: String,
    pub category_id: String,
    pub amount: f64,
    pub description: String,
    pub transaction_date: NaiveDateTime,
    pub transaction_type: AccountBookType,
    pub counterparty: Option<String>,
    pub invoice_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

/// 发票
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub invoice_date: NaiveDateTime,
    pub amount: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
    pub seller_name: String,
    pub buyer_name: String,
    pub invoice_type: String,
    pub status: InvoiceStatus,
    pub image_path: Option<String>,
    pub ocr_result: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

/// 发票状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InvoiceStatus {
    /// 待处理
    Pending,
    /// 已匹配
    Matched,
    /// 已作废
    Void,
}

impl InvoiceStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            InvoiceStatus::Pending => "pending",
            InvoiceStatus::Matched => "matched",
            InvoiceStatus::Void => "void",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(InvoiceStatus::Pending),
            "matched" => Some(InvoiceStatus::Matched),
            "void" => Some(InvoiceStatus::Void),
            _ => None,
        }
    }
}

/// 预算
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    pub id: String,
    pub category_id: String,
    pub amount: f64,
    pub period_type: PeriodType,
    pub start_date: NaiveDateTime,
    pub end_date: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

/// 预算周期类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PeriodType {
    /// 月度
    Monthly,
    /// 季度
    Quarterly,
    /// 年度
    Yearly,
}

impl PeriodType {
    pub fn as_str(&self) -> &'static str {
        match self {
            PeriodType::Monthly => "monthly",
            PeriodType::Quarterly => "quarterly",
            PeriodType::Yearly => "yearly",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "monthly" => Some(PeriodType::Monthly),
            "quarterly" => Some(PeriodType::Quarterly),
            "yearly" => Some(PeriodType::Yearly),
            _ => None,
        }
    }
}

/// 审计日志
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub table_name: String,
    pub record_id: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub ip_address: Option<String>,
    pub created_at: NaiveDateTime,
}