use crate::db::models::{Category, AccountBookType};
use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub parent_id: Option<String>,
    pub book_type: String,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub id: String,
    pub name: Option<String>,
    pub parent_id: Option<String>,
    pub book_type: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}

#[tauri::command]
pub fn get_categories(
    db: State<'_, Arc<Database>>,
    book_type: Option<String>,
) -> Result<Vec<Category>, String> {
    let conn = db.get_connection();
    let mut sql = String::from(
        "SELECT id, name, parent_id, book_type, icon, sort_order, created_at FROM categories"
    );
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(book_type) = &book_type {
        sql.push_str(" WHERE book_type = ?");
        params.push(Box::new(book_type.clone()));
    }

    sql.push_str(" ORDER BY sort_order ASC, created_at ASC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let categories = stmt
        .query_map(rusqlite::params_from_iter(params.iter()), |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                book_type: AccountBookType::from_str(&row.get::<_, String>(3)?)
                    .unwrap_or(AccountBookType::Expense),
                icon: row.get(4)?,
                sort_order: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(categories)
}

#[tauri::command]
pub fn create_category(
    db: State<'_, Arc<Database>>,
    request: CreateCategoryRequest,
) -> Result<Category, String> {
    let conn = db.get_connection();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().naive_utc();
    let book_type = AccountBookType::from_str(&request.book_type)
        .ok_or("Invalid book type")?;
    let sort_order = request.sort_order.unwrap_or(0);

    conn.execute(
        "INSERT INTO categories (id, name, parent_id, book_type, icon, sort_order, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, request.name, request.parent_id, book_type.as_str(), request.icon, sort_order, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(Category {
        id,
        name: request.name,
        parent_id: request.parent_id,
        book_type,
        icon: request.icon,
        sort_order,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_category(
    db: State<'_, Arc<Database>>,
    request: UpdateCategoryRequest,
) -> Result<Category, String> {
    let conn = db.get_connection();
    let now = chrono::Utc::now().naive_utc();

    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(name) = &request.name {
        updates.push("name = ?");
        values.push(Box::new(name.clone()));
    }
    if let Some(parent_id) = &request.parent_id {
        updates.push("parent_id = ?");
        values.push(Box::new(parent_id.clone()));
    }
    if let Some(book_type) = &request.book_type {
        updates.push("book_type = ?");
        values.push(Box::new(book_type.clone()));
    }
    if let Some(icon) = &request.icon {
        updates.push("icon = ?");
        values.push(Box::new(icon.clone()));
    }
    if let Some(sort_order) = request.sort_order {
        updates.push("sort_order = ?");
        values.push(Box::new(sort_order));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    values.push(Box::new(request.id.clone()));

    let sql = format!(
        "UPDATE categories SET {} WHERE id = ?",
        updates.join(", ")
    );

    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;

    // 返回更新后的记录
    let category = conn
        .query_row(
            "SELECT id, name, parent_id, book_type, icon, sort_order, created_at FROM categories WHERE id = ?",
            params![request.id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    parent_id: row.get(2)?,
                    book_type: AccountBookType::from_str(&row.get::<_, String>(3)?)
                        .unwrap_or(AccountBookType::Expense),
                    icon: row.get(4)?,
                    sort_order: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(category)
}

#[tauri::command]
pub fn delete_category(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    let conn = db.get_connection();
    
    // 检查是否有子分类
    let has_children: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM categories WHERE parent_id = ?",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if has_children {
        return Err("Cannot delete category with children".to_string());
    }

    // 检查是否有关联的交易记录
    let has_transactions: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM transactions WHERE category_id = ?",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if has_transactions {
        return Err("Cannot delete category with transactions".to_string());
    }

    conn.execute("DELETE FROM categories WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}