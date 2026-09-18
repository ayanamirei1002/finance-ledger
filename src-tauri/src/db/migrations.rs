use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 创建账簿表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS account_books (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            book_type TEXT NOT NULL CHECK(book_type IN ('income', 'expense', 'transfer')),
            currency TEXT NOT NULL DEFAULT 'CNY',
            is_default BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );"
    )?;

    // 创建科目分类表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT,
            book_type TEXT NOT NULL CHECK(book_type IN ('income', 'expense', 'transfer')),
            icon TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
        );"
    )?;

    // 创建交易记录表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            category_id TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            transaction_date DATETIME NOT NULL,
            transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense', 'transfer')),
            counterparty TEXT,
            invoice_id TEXT,
            tags TEXT,
            notes TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES account_books(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
        );"
    )?;

    // 创建发票表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL UNIQUE,
            invoice_date DATETIME NOT NULL,
            amount REAL NOT NULL,
            tax_amount REAL NOT NULL DEFAULT 0,
            total_amount REAL NOT NULL,
            seller_name TEXT NOT NULL,
            buyer_name TEXT NOT NULL,
            invoice_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'void')),
            image_path TEXT,
            ocr_result TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );"
    )?;

    // 创建预算表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL,
            amount REAL NOT NULL,
            period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'quarterly', 'yearly')),
            start_date DATETIME NOT NULL,
            end_date DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );"
    )?;

    // 创建审计日志表
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );"
    )?;

    // 创建索引
    conn.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
         CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
         CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
         CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
         CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
         CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
         CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
         CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);"
    )?;

    // 插入默认数据
    insert_default_data(conn)?;

    Ok(())
}

fn insert_default_data(conn: &Connection) -> Result<(), rusqlite::Error> {
    // 检查是否已有默认账簿
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM account_books WHERE is_default = 1",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        // 创建默认账簿
        conn.execute(
            "INSERT INTO account_books (id, name, description, book_type, currency, is_default) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![
                uuid::Uuid::new_v4().to_string(),
                "默认账簿",
                "系统默认账簿",
                "expense",
                "CNY",
                true
            ],
        )?;

        // 创建默认收入分类
        let income_categories = vec![
            ("工资薪金", 1),
            ("奖金", 2),
            ("投资收益", 3),
            ("兼职收入", 4),
            ("其他收入", 5),
        ];

        for (name, sort_order) in income_categories {
            conn.execute(
                "INSERT INTO categories (id, name, book_type, sort_order) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![
                    uuid::Uuid::new_v4().to_string(),
                    name,
                    "income",
                    sort_order
                ],
            )?;
        }

        // 创建默认支出分类
        let expense_categories = vec![
            ("餐饮", 1),
            ("交通", 2),
            ("购物", 3),
            ("住房", 4),
            ("娱乐", 5),
            ("医疗", 6),
            ("教育", 7),
            ("通讯", 8),
            ("其他支出", 9),
        ];

        for (name, sort_order) in expense_categories {
            conn.execute(
                "INSERT INTO categories (id, name, book_type, sort_order) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![
                    uuid::Uuid::new_v4().to_string(),
                    name,
                    "expense",
                    sort_order
                ],
            )?;
        }
    }

    Ok(())
}