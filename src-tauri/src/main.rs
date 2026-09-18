// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;

use db::Database;
use std::sync::Arc;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 初始化数据库
            let db = Database::new().expect("Failed to initialize database");
            let db = Arc::new(db);
            
            // 将数据库实例注册到应用状态
            app.manage(db);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 账簿相关命令
            commands::account_book::get_account_books,
            commands::account_book::create_account_book,
            commands::account_book::update_account_book,
            commands::account_book::delete_account_book,
            
            // 交易记录相关命令
            commands::transaction::get_transactions,
            commands::transaction::create_transaction,
            commands::transaction::update_transaction,
            commands::transaction::delete_transaction,
            
            // 分类相关命令
            commands::category::get_categories,
            commands::category::create_category,
            commands::category::update_category,
            commands::category::delete_category,
            
            // 发票相关命令
            commands::invoice::get_invoices,
            commands::invoice::create_invoice,
            commands::invoice::update_invoice,
            commands::invoice::delete_invoice,
            
            // 统计相关命令
            commands::stats::get_summary,
            commands::stats::get_monthly_stats,
            commands::stats::get_category_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}