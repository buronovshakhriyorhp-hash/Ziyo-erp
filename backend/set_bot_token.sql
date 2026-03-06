-- set_bot_token.sql
UPDATE erp.system_settings 
SET value = '8239416093:AAFRqA9J7Z9i4CUnDwmVyAXpG324ia20EQE' 
WHERE key = 'telegram_bot_token';

INSERT INTO erp.system_settings (key, value, description)
SELECT 'telegram_bot_token', '8239416093:AAFRqA9J7Z9i4CUnDwmVyAXpG324ia20EQE', 'Telegram Bot Token for notifications'
WHERE NOT EXISTS (
    SELECT id FROM erp.system_settings WHERE key = 'telegram_bot_token'
);
