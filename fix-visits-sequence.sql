-- SQL скрипт для виправлення проблеми з послідовністю visits
-- Запустіть цей скрипт в psql або у вашому клієнті PostgreSQL

-- 1. Подивитися поточний стан
SELECT 'Current max ID in visits:' as info, COALESCE(MAX(id), 0) as max_id FROM visits;

-- 2. Подивитися поточне значення послідовності
SELECT 'Current sequence value:' as info, last_value FROM visits_id_seq;

-- 3. Встановити послідовність на правильне значення
-- Замініть це на актуальне максимальне значення + 1
SELECT setval('visits_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM visits), false);

-- 4. Перевірити що послідовність тепер працює правильно
SELECT 'Next sequence value will be:' as info, nextval('visits_id_seq') as next_id;

-- 5. Повернути послідовність назад (щоб не пропустити ID)
SELECT setval('visits_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM visits), false);

-- Перевірка остаточного стану
SELECT 'Final check - max ID:' as info, COALESCE(MAX(id), 0) as max_id FROM visits;
SELECT 'Final check - sequence:' as info, last_value FROM visits_id_seq;