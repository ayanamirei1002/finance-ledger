use crate::db::models::{AccountBook, AccountBookType};
use crate::db::Database;
use chrono::NaiveDateTime;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAccountBookRequest {
    pub name: String,
    pub description: Option<String>,
    pub book_type: String,
    pub currency: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateAccountBookRequest {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub book_type: Option<String>,
    pub currency: Option<String>,
}

#[tauri::command]
pub fn get_account_books(db: State<'_, Arc<Database>>) -> Result<Vec<AccountBook>, String> {
    let conn = db.get_connection();
    let mut stmt = conn
        .prepare("SELECT id, name, description, book_type, currency, is_default, created_at, updated_at FROM account_books ORDER BY is_default DESC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let books = stmt
        .query_map([], |row| {
            Ok(AccountBook {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                book_type: AccountBookType::from_str(&row.get::<_, String>(3)?)
                    .unwrap_or(AccountBookType::Expense),
                currency: row.get(4)?,
                is_default: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(books)
}

#[tauri::command]
pub fn create_account_book(
    db: State<'_, Arc<Database>>,
    request: CreateAccountBookRequest,
) -> Result<AccountBook, String> {
    let conn = db.get_connection();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().naive_utc();
    let book_type = AccountBookType::from_str(&request.book_type)
        .ok_or("Invalid book type")?;
    let currency = request.currency.unwrap_or_else(|| "CNY".to_string());

    conn.execute(
        "INSERT INTO account_books (id, name, description, book_type, currency, is_default, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, request.name, request.description, book_type.as_str(), currency, false, now, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(AccountBook {
        id,
        name: request.name,
        description: request.description,
        book_type,
        currency,
        is_default: false,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_account_book(
    db: State<'_, Arc<Database>>,
    request: UpdateAccountBookRequest,
) -> Result<AccountBook, String> {
    let conn = db.get_connection();
    let now = chrono::Utc::now().naive_utc();

    // 构建动态更新语句
    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(name) = &request.name {
        updates.push("name = ?");
        values.push(Box::new(name.clone()));
    }
    if let Some(description) = &request.description {
        updates.push("description = ?");
        values.push(Box::new(description.clone()));
    }
    if let Some(book_type) = &request.book_type {
        updates.push("book_type = ?");
        values.push(Box::new(book_type.clone()));
    }
    if let Some(currency) = &request.currency {
        updates.push("currency = ?");
        values.push(Box::new(currency.clone()));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = ?");
    values.push(Box::new(now));
    values.push(Box::new(request.id.clone()));

    let sql = format!(
        "UPDATE account_books SET {} WHERE id = ?",
        updates.join(", ")
    );

    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;

    // 返回更新后的记录
    let book = conn
        .query_row(
            "SELECT id, name, description, book_type, currency, is_default, created_at, updated_at FROM account_books WHERE id = ?",
            params![request.id],
            |row| {
                Ok(AccountBook {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    book_type: AccountBookType::from_str(&row.get::<_, String>(3)?)
                        .unwrap_or(AccountBookType::Expense),
                    currency: row.get(4)?,
                    is_default: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(book)
}

#[tauri::command]
pub fn delete_account_book(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    let conn = db.get_connection();
    
    // 检查是否为默认账簿
    let is_default: bool = conn
        .query_row(
            "SELECT is_default FROM account_books WHERE id = ?",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if is_default {
        return Err("Cannot delete default account book".to_string());
    }

    conn.execute("DELETE FROM account_books WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}