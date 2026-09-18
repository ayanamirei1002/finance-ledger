use rusqlite::Connection;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;

use crate::db::Database;

impl Database {
    pub fn get_connection(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }

    pub fn with_transaction<F, R>(&self, f: F) -> Result<R, rusqlite::Error>
    where
        F: FnOnce(&Connection) -> Result<R, rusqlite::Error>,
    {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch("BEGIN TRANSACTION")?;
        let result = f(&conn);
        match result {
            Ok(r) => {
                conn.execute_batch("COMMIT")?;
                Ok(r)
            }
            Err(e) => {
                conn.execute_batch("ROLLBACK")?;
                Err(e)
            }
        }
    }
}

/// 获取应用数据目录
pub fn get_app_data_path(app_handle: &tauri::AppHandle) -> PathBuf {
    app_data_dir(&app_handle.config()).unwrap_or_else(|| {
        PathBuf::from(".").join("data")
    })
}