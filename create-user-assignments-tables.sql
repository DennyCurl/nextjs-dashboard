-- Таблиці organizations, departments та localizations вже існують
-- Цей скрипт додає тільки тестові дані

-- Insert sample data for organizations
INSERT INTO users.organizations (organization_name) VALUES 
  ('Медична частина №43'),
  ('Головний госпіталь')
ON CONFLICT DO NOTHING;

-- Insert sample data for departments
INSERT INTO users.departments (department_name) VALUES 
  ('Терапія'),
  ('Хірургія'),
  ('Кардіологія'),
  ('Неврологія'),
  ('Педіатрія')
ON CONFLICT DO NOTHING;

-- Insert sample data for localizations
INSERT INTO users.localizations (localization_name) VALUES 
  ('Київ'),
  ('Львів'),
  ('Одеса'),
  ('Дніпро'),
  ('Харків')
ON CONFLICT DO NOTHING;

-- Приклад додавання призначення для користувача
-- Розкоментуйте та замініть значення на реальні:
/*
INSERT INTO users.assignments (
  user_id, 
  organization_id, 
  department_id, 
  localization_id, 
  role_id, 
  level
) VALUES (
  'ваш-user-id-uuid'::uuid,  -- Замініть на реальний UUID користувача з auth.users
  1,                          -- ID організації з users.organizations
  1,                          -- ID відділу з users.departments (можна NULL)
  1,                          -- ID локалізації з users.localizations (можна NULL)
  1,                          -- ID ролі з users.roles
  1                           -- Рівень (можна NULL)
);
*/

