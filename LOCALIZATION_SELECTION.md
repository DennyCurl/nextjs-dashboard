# Система Вибору Локалізації

## Опис

Система автоматичного вибору або примусового вибору робочої локалізації після входу користувача в систему.

## Функціонал

### 1. Автоматична Логіка

- **Одна локалізація**: Якщо у користувача лише одне призначення (local_assignment), воно автоматично встановлюється як поточне
- **Декілька локалізацій**: Користувач перенаправляється на сторінку вибору локалізації
- **Без локалізацій**: Показується повідомлення з проханням звернутися до адміністратора

### 2. Middleware Захист

Файл: `middleware.ts`

Перевіряє наявність `current_locals_id` в cookies перед доступом до захищених маршрутів:
- Якщо немає локалізації → редирект на `/select-localization`
- Якщо є локалізація → дозволяє доступ до `/dashboard/*`

### 3. API Endpoints

#### GET `/api/current-localization`

Отримує поточну локалізацію та список доступних локалізацій користувача.

**Відповідь:**
```json
{
  "assignments": [...],
  "current": {...} | null,
  "needsSelection": boolean
}
```

#### POST `/api/current-localization`

Встановлює поточну локалізацію користувача.

**Тіло запиту:**
```json
{
  "locals_id": 123
}
```

**Зберігання:** Cookie `current_locals_id` (HTTP-only, 7 днів)

### 4. Компоненти

#### `/app/select-localization/page.tsx`

Сторінка вибору локалізації:
- Автоматичний вибір для однієї локалізації
- Візуальний вибір для декількох локалізацій
- Обробка помилок (відсутність локалізацій)

#### `/app/ui/dashboard/localization-selector.tsx`

Компонент у sidebar для перемикання локалізації:
- Показує поточну локалізацію
- Dropdown для зміни локалізації
- Автоматично приховується, якщо одна локалізація

### 5. Helper Functions

Файл: `app/lib/localization.ts`

```typescript
// Отримати поточну локалізацію з cookies
getCurrentLocalsId(): Promise<number | null>

// Перевірити чи встановлена локалізація
hasLocalization(): Promise<boolean>
```

## Використання в Коді

### Отримання Поточної Локалізації

```typescript
import { getCurrentLocalsId } from '@/app/lib/localization';

const localsId = await getCurrentLocalsId();
if (localsId) {
  // Використовувати для фільтрації даних
}
```

### Фільтрація Даних за Локалізацією

У запитах до бази даних можна фільтрувати за поточною локалізацією:

```typescript
const localsId = await getCurrentLocalsId();

const data = await sql`
  SELECT *
  FROM visits v
  WHERE v.assignment_id = ${localsId}
`;
```

## Структура Бази Даних

### Таблиця `users.local_assignments`

Зв'язок між користувачами та локалізаціями:
```sql
- id: bigint
- user_id: uuid (FK → auth.users)
- locals_id: bigint (FK → users.locals)
```

### Таблиця `users.locals`

Ієрархічна структура локалізації:
```sql
- id: bigint
- organization_id: bigint (FK → users.organizations)
- department_id: bigint (FK → users.departments) - nullable
- room_id: bigint (FK → users.rooms) - nullable
```

## Флоу Користувача

1. **Вхід в систему** → Редирект на `/dashboard`
2. **Middleware перевірка** → Чи є `current_locals_id`?
   - **Немає** → Редирект на `/select-localization`
   - **Є** → Дозволити доступ
3. **Сторінка вибору локалізації**:
   - 0 локалізацій → Помилка
   - 1 локалізація → Автоматичний вибір + редирект
   - 2+ локалізацій → Показати список для вибору
4. **Після вибору** → Збереження в cookie + редирект на `/dashboard`

## Зміна Локалізації

Користувач може змінити локалізацію через:
- Selector у sidebar (якщо декілька локалізацій)
- Сторінка `/select-localization` (можна відкрити вручну)

При зміні локалізації:
1. POST запит до `/api/current-localization`
2. Оновлення cookie
3. `router.refresh()` - перезавантаження даних

## Безпека

- Cookie з `httpOnly: true` (недоступний з JavaScript)
- Перевірка доступу на рівні API (користувач має призначення?)
- Middleware захист всіх `/dashboard/*` маршрутів
- Supabase RLS для додаткового захисту

## Майбутні Покращення

- [ ] Зберігання останньої локалізації в БД (не тільки cookie)
- [ ] Історія змін локалізації для аудиту
- [ ] Можливість працювати з декількома локалізаціями одночасно (мультивкладки)
- [ ] Фільтрація даних за локалізацією на рівні RLS Supabase
