pub mod models;
pub mod schema;
pub mod connection;
pub mod migrations;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self, rusqlite::Error> {
        let conn = Connection::open("finance_ledger.db")?;
        
        // 启用外键约束
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        
        // 创建表结构
        migrations::run_migrations(&conn)?;
        
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}