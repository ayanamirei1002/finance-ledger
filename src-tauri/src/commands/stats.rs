use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct Summary {
    pub total_income: f64,
    pub total_expense: f64,
    pub balance: f64,
    pub transaction_count: i64,
    pub invoice_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyStats {
    pub month: String,
    pub income: f64,
    pub expense: f64,
    pub balance: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryStats {
    pub category_id: String,
    pub category_name: String,
    pub total_amount: f64,
    pub transaction_count: i64,
    pub percentage: f64,
}

#[tauri::command]
pub fn get_summary(db: State<'_, Arc<Database>>) -> Result<Summary, String> {
    let conn = db.get_connection();

    // 获取总收入
    let total_income: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type = 'income'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 获取总支出
    let total_expense: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE transaction_type = 'expense'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 获取交易数量
    let transaction_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM transactions", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    // 获取发票数量
    let invoice_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM invoices", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(Summary {
        total_income,
        total_expense,
        balance: total_income - total_expense,
        transaction_count,
        invoice_count,
    })
}

#[tauri::command]
pub fn get_monthly_stats(
    db: State<'_, Arc<Database>>,
    year: Option<i32>,
) -> Result<Vec<MonthlyStats>, String> {
    let conn = db.get_connection();
    let year = year.unwrap_or_else(|| chrono::Utc::now().format("%Y").to_string().parse().unwrap());

    let mut stmt = conn
        .prepare(
            "SELECT 
                strftime('%Y-%m', transaction_date) as month,
                SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expense,
                SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END) as balance
            FROM transactions
            WHERE strftime('%Y', transaction_date) = ?1
            GROUP BY strftime('%Y-%m', transaction_date)
            ORDER BY month ASC",
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map(params![year.to_string()], |row| {
            Ok(MonthlyStats {
                month: row.get(0)?,
                income: row.get(1)?,
                expense: row.get(2)?,
                balance: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(stats)
}

#[tauri::command]
pub fn get_category_stats(
    db: State<'_, Arc<Database>>,
    transaction_type: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<CategoryStats>, String> {
    let conn = db.get_connection();

    let mut sql = String::from(
        "SELECT 
            c.id as category_id,
            c.name as category_name,
            COALESCE(SUM(t.amount), 0) as total_amount,
            COUNT(t.id) as transaction_count
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id
        WHERE 1=1"
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(transaction_type) = &transaction_type {
        sql.push_str(" AND c.book_type = ?");
        params.push(Box::new(transaction_type.clone()));
    }
    if let Some(start_date) = &start_date {
        sql.push_str(" AND t.transaction_date >= ?");
        params.push(Box::new(start_date.clone()));
    }
    if let Some(end_date) = &end_date {
        sql.push_str(" AND t.transaction_date <= ?");
        params.push(Box::new(end_date.clone()));
    }

    sql.push_str(" GROUP BY c.id, c.name ORDER BY total_amount DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let mut stats: Vec<CategoryStats> = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(CategoryStats {
                category_id: row.get(0)?,
                category_name: row.get(1)?,
                total_amount: row.get(2)?,
                transaction_count: row.get(3)?,
                percentage: 0.0, // 将在下面计算
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // 计算百分比
    let total: f64 = stats.iter().map(|s| s.total_amount).sum();
    if total > 0.0 {
        for stat in &mut stats {
            stat.percentage = (stat.total_amount / total) * 100.0;
        }
    }

    Ok(stats)
}