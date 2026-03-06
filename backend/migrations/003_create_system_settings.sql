-- Telegram va boshqa tizim sozlamalari uchun jadval
CREATE TABLE IF NOT EXISTS erp.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES erp.users(id)
);

-- Boshlang'ich (placeholder) qiymatlar
INSERT INTO erp.system_settings (key, value, description)
VALUES 
    ('telegram_bot_token', '', 'Telegram Bot API Token'),
    ('telegram_chat_id', '', 'Telegram Group/Channel Chat ID')
ON CONFLICT (key) DO NOTHING;
