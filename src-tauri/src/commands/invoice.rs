use crate::db::models::{Invoice, InvoiceStatus};
use crate::db::Database;
use chrono::NaiveDateTime;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceRequest {
    pub invoice_number: String,
    pub invoice_date: String,
    pub amount: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
    pub seller_name: String,
    pub buyer_name: String,
    pub invoice_type: String,
    pub status: Option<String>,
    pub image_path: Option<String>,
    pub ocr_result: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInvoiceRequest {
    pub id: String,
    pub invoice_number: Option<String>,
    pub invoice_date: Option<String>,
    pub amount: Option<f64>,
    pub tax_amount: Option<f64>,
    pub total_amount: Option<f64>,
    pub seller_name: Option<String>,
    pub buyer_name: Option<String>,
    pub invoice_type: Option<String>,
    pub status: Option<String>,
    pub image_path: Option<String>,
    pub ocr_result: Option<String>,
}

#[tauri::command]
pub fn get_invoices(db: State<'_, Arc<Database>>) -> Result<Vec<Invoice>, String> {
    let conn = db.get_connection();
    let mut stmt = conn
        .prepare("SELECT id, invoice_number, invoice_date, amount, tax_amount, total_amount, seller_name, buyer_name, invoice_type, status, image_path, ocr_result, created_at, updated_at FROM invoices ORDER BY invoice_date DESC")
        .map_err(|e| e.to_string())?;

    let invoices = stmt
        .query_map([], |row| {
            Ok(Invoice {
                id: row.get(0)?,
                invoice_number: row.get(1)?,
                invoice_date: row.get(2)?,
                amount: row.get(3)?,
                tax_amount: row.get(4)?,
                total_amount: row.get(5)?,
                seller_name: row.get(6)?,
                buyer_name: row.get(7)?,
                invoice_type: row.get(8)?,
                status: InvoiceStatus::from_str(&row.get::<_, String>(9)?)
                    .unwrap_or(InvoiceStatus::Pending),
                image_path: row.get(10)?,
                ocr_result: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(invoices)
}

#[tauri::command]
pub fn create_invoice(
    db: State<'_, Arc<Database>>,
    request: CreateInvoiceRequest,
) -> Result<Invoice, String> {
    let conn = db.get_connection();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().naive_utc();
    let invoice_date = NaiveDateTime::parse_from_str(&request.invoice_date, "%Y-%m-%d %H:%M:%S")
        .or_else(|_| NaiveDateTime::parse_from_str(&request.invoice_date, "%Y-%m-%d"))
        .map_err(|e| format!("Invalid date format: {}", e))?;
    let status = InvoiceStatus::from_str(&request.status.unwrap_or_else(|| "pending".to_string()))
        .unwrap_or(InvoiceStatus::Pending);

    conn.execute(
        "INSERT INTO invoices (id, invoice_number, invoice_date, amount, tax_amount, total_amount, seller_name, buyer_name, invoice_type, status, image_path, ocr_result, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            id,
            request.invoice_number,
            invoice_date,
            request.amount,
            request.tax_amount,
            request.total_amount,
            request.seller_name,
            request.buyer_name,
            request.invoice_type,
            status.as_str(),
            request.image_path,
            request.ocr_result,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Invoice {
        id,
        invoice_number: request.invoice_number,
        invoice_date,
        amount: request.amount,
        tax_amount: request.tax_amount,
        total_amount: request.total_amount,
        seller_name: request.seller_name,
        buyer_name: request.buyer_name,
        invoice_type: request.invoice_type,
        status,
        image_path: request.image_path,
        ocr_result: request.ocr_result,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_invoice(
    db: State<'_, Arc<Database>>,
    request: UpdateInvoiceRequest,
) -> Result<Invoice, String> {
    let conn = db.get_connection();
    let now = chrono::Utc::now().naive_utc();

    let mut updates = Vec::new();
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(invoice_number) = &request.invoice_number {
        updates.push("invoice_number = ?");
        values.push(Box::new(invoice_number.clone()));
    }
    if let Some(invoice_date) = &request.invoice_date {
        updates.push("invoice_date = ?");
        values.push(Box::new(invoice_date.clone()));
    }
    if let Some(amount) = request.amount {
        updates.push("amount = ?");
        values.push(Box::new(amount));
    }
    if let Some(tax_amount) = request.tax_amount {
        updates.push("tax_amount = ?");
        values.push(Box::new(tax_amount));
    }
    if let Some(total_amount) = request.total_amount {
        updates.push("total_amount = ?");
        values.push(Box::new(total_amount));
    }
    if let Some(seller_name) = &request.seller_name {
        updates.push("seller_name = ?");
        values.push(Box::new(seller_name.clone()));
    }
    if let Some(buyer_name) = &request.buyer_name {
        updates.push("buyer_name = ?");
        values.push(Box::new(buyer_name.clone()));
    }
    if let Some(invoice_type) = &request.invoice_type {
        updates.push("invoice_type = ?");
        values.push(Box::new(invoice_type.clone()));
    }
    if let Some(status) = &request.status {
        updates.push("status = ?");
        values.push(Box::new(status.clone()));
    }
    if let Some(image_path) = &request.image_path {
        updates.push("image_path = ?");
        values.push(Box::new(image_path.clone()));
    }
    if let Some(ocr_result) = &request.ocr_result {
        updates.push("ocr_result = ?");
        values.push(Box::new(ocr_result.clone()));
    }

    if updates.is_empty() {
        return Err("No fields to update".to_string());
    }

    updates.push("updated_at = ?");
    values.push(Box::new(now));
    values.push(Box::new(request.id.clone()));

    let sql = format!(
        "UPDATE invoices SET {} WHERE id = ?",
        updates.join(", ")
    );

    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;

    // 返回更新后的记录
    let invoice = conn
        .query_row(
            "SELECT id, invoice_number, invoice_date, amount, tax_amount, total_amount, seller_name, buyer_name, invoice_type, status, image_path, ocr_result, created_at, updated_at FROM invoices WHERE id = ?",
            params![request.id],
            |row| {
                Ok(Invoice {
                    id: row.get(0)?,
                    invoice_number: row.get(1)?,
                    invoice_date: row.get(2)?,
                    amount: row.get(3)?,
                    tax_amount: row.get(4)?,
                    total_amount: row.get(5)?,
                    seller_name: row.get(6)?,
                    buyer_name: row.get(7)?,
                    invoice_type: row.get(8)?,
                    status: InvoiceStatus::from_str(&row.get::<_, String>(9)?)
                        .unwrap_or(InvoiceStatus::Pending),
                    image_path: row.get(10)?,
                    ocr_result: row.get(11)?,
                    created_at: row.get(12)?,
                    updated_at: row.get(13)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(invoice)
}

#[tauri::command]
pub fn delete_invoice(db: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    let conn = db.get_connection();
    conn.execute("DELETE FROM invoices WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}