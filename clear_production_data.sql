DELETE FROM settings;

DELETE FROM leads;

SELECT 'settings' as table_name, COUNT(*) as count FROM settings
UNION ALL
SELECT 'leads' as table_name, COUNT(*) as count FROM leads;