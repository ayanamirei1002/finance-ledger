use crate::db::models::{Transaction, AccountBookType};
use crate::db::Database;
use chrono::NaiveDateTime;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTransactionRequest {
    pub book_id: String,
    pub category_id: String,
    pub amount: f64,
    pub description: String,
    pub transaction_date: String,
    pub transaction_type: String,
    pub counterparty: Option<String>,
    pub invoice_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTransactionRequest {
    pub id: String,
    pub book_id: Option<String>,
    pub category_id: Option<String>,
    pub amount: Option<f64>,
    pub description: Option<String>,
    pub transaction_date: Option<String>,
    pub transaction_type: Option<String>,
    pub counterparty: Option<String>,
    pub invoice_id: Option<String>,
    pub tags: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionFilter {
    pub book_id: Option<String>,
    pub category_id: Option<String>,
    pub transaction_type: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[tauri::command]
pub fn get_transactions(
    db: State<'_, Arc<Database>>,
    filter: Option<TransactionFilter>,
) -> Result<Vec<Transaction>, String> {
    let conn = db.get_connection();
    let filter = filter.unwrap_or(TransactionFilter {
        book_id: None,
        category_id: None,
        transaction_type: None,
        start_date: None,
        end_date: None,
        search: None,
        page: Some(1),
        page_size: Some(20),
    });

    let mut sql = String::from(
        "SELECT id, book_id, category_id, amount, description, transaction_date, transaction_type, counterparty, invoice_id, tags, notes, created_at, updated_at FROM transactions WHERE 1=1"
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(book_id) = &filter.book_id {
        sql.push_str(" AND book_id = ?");
        params.push(Box::new(book_id.clone()));
    }
    if let Some(category_id) = &filter.category_id {
        sql.push_str(" AND category_id = ?");
        params.push(Box::new(category_id.clone()));
    }
    if let Some(transaction_type) = &filter.transaction_type {
        sql.push_str(" AND transaction_type = ?");
        params.push(Box::new(transaction_type.clone()));
    }
    if let Some(start_date) = &filter.start_date {
        sql.push_str(" AND transaction_date >= ?");
        params.push(Box::new(start_date.clone()));
    }
    if let Some(end_date) = &filter.end_date {
        sql.push_str(" AND transaction_date <= ?");
        params.push(Box::new(end_date.clone()));
    }
    if let Some(search) = &filter.search {
        sql.push_str(" AND (description LIKE ? OR counterparty LIKE ? OR notes LIKE ?)");
        let search_pattern = format!("%{}%", search);
        params.push(Box::new(search_pattern.clone()));
        params.push(Box::new(search_pattern.clone()));
        params.push(Box::new(search_pattern));
    }

    sql.push_str(" ORDER BY transaction_date DESC");

    if let (Some(page), Some(page_size)) = (filter.page, filter.page_size) {
        let offset = (page - 1) * page_size;
        sql.push_str(&format!(" LIMIT {} OFFSET {}", page_size, offset));
    }

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let transactions = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(Transaction {
                id: row.get(0)?,
                book_id: row.get(1)?,
                category_id: row.get(2)?,
                amount: row.get(3)?,
                description: row.get(4)?,
                transaction_date: row.get(5)?,
                transaction_type: AccountBookType::from_str(&row.get::<_, String>(6)?)
                    .unwrap_or(AccountBookType::Expense),
                counterparty: row.get(7)?,
                invoice_id: row.get(8)?,
                tags: row.get(9)?,
                notes: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(transactions)
}

#[tauri::command]
pub fn create_transaction(
    db: State<'_, Arc<Database>>,
    request: CreateTransactionRequest,
) -> Result<Transaction, String> {
    let conn = db.get_connection();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().naive_utc();
    let transaction_date = NaiveDateTime::parse_from_str(&request.transaction_date, "%Y-%m-%d %H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(&request.transaction_date, "%Y-%m-%d"))
        .map_err(|e| format!("Invalid date format: {}", e))?;
    let transaction_type = AccountBookType::from_str(&request.transaction_type)
        .ok_or("Invalid transaction type")?;

    conn.execute(
        "INSERT INTO transactions (id, book_id, category_id, amount, description, transaction_date, transaction_type, counterparty, invoice_id, tags, notes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            request.book_id,
            request.category_id,
            request.amount,
            request.description,
            transaction_date,
            transaction_type.as_str(),
            request.counterparty,
            request.invoice_id,
            request.tags,
            request.notes,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Transaction {
        id,
        book_id: request.book_id,
        category_id: request.category_id,
        amount: request.amount,
        description: request.description,
        transaction_date,
        transaction_type,
        counterparty: request.counterparty,
        invoice_id: request.invoice_id,
        tags: request.tags,
        notes: request.notes,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_transaction(
    db: State<'_, Arc<Database>>,
    request: UpdateTransactionRequest,
) -> Result<Transaction, String> {
    let conn = db.get_connection();
    let now = chrono::Utc::now().naive_utc();

    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(book_id) = &request.book_id {
        updates.push("book_id = ?");
        values.push(Box::new(book_id.clone()));
    }
    if let Some(category_id) = &request.category_id {
        updates.push("category_id = ?");
        values.push(Box::new(category_id.clone()));
    }
    if let Some(amount) = request.amount {
        updates.push("amount = ?");
        values.push(Box::new(amount));
    }
    if let Some(description) = &request.description {
        updates.push("description = ?");
        values.push(Box::new(description.clone()));
    }
    if let Some(transaction_date) = &request.transaction_date {
        updates.push("transaction_date = ?");
        values.push(Box::new(transaction_date.clone()));
    }
    if let Some(transaction_type) = &request.transaction_type {
        updates.push("transaction_type = ?");
        values.push(Box::new(transaction_type.clone()));
    }
    if let Some(counterparty) = &request.counterparty {
        updates.push("counterparty = ?");
        values.push(Box::new(counterparty.clone()));
    }
    if let Some(invoice_id) = &request.invoice_id {
        updates.push("invoice_id = ?");
        values.push(Box::new(invoice_id.clone()));
    }
    if let Some(tags) = &request.tags {
        updates.push("tags = ?");
        values.push(Box::new(tags.clone()));
    }
    if let Some(notes) = &request.notes {
        updates.push("notes = ?");
        values.push(Box::new(notes.clone()));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = ?");
    values.push(Box::new(now));
    values.push(Box::new(request.id.clone()));

    let sql = format!(
        "UPDATE transactions SET {} WHERE id = ?",
        updates.join(", ")
    );

    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;

    // 返回更新后的记录
    let transaction = conn
        .query_row(
            "SELECT id, book_id, category_id, amount, description, transaction_date, transaction_type, counterparty, invoice_id, tags, notes, created_at, updated_at FROM transactions WHERE id = ?",
            params![request.id],
            |row| {
                Ok(Transaction {
                    id: row.get(0)?,
                    book_id: row.get(1)?,
                    category_id: row.get(2)?,
                    amount: row.get(3)?,
                    description: row.get(4)?,
                    transaction_date: row.get(5)?,
                    transaction_type: AccountBookType::from_str(&row.get::<_, String>(6)?)
                        .unwrap_or(AccountBookType::Expense),
                    counterparty: row.get(7)?,
                    invoice_id: row.get(8)?,
                    tags: row.get(9)?,
                    notes: row.get(10)?,
                    created_at: row.get(11)?,
                    updated_at: row.get(12)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(transaction)
}

#[tauri::command]
pub fn delete_transaction(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    let conn = db.get_connection();
    conn.execute("DELETE FROM transactions WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}