# ✅ Trigger успешно применён!

## Что было сделано:

1. ✅ Обновлён Supabase CLI до v2.47.2
2. ✅ Применена миграция `20250125000000_auto_create_profile_trigger.sql`
3. ✅ Database trigger `on_auth_user_created` теперь активен в вашей базе данных

## 🧪 Тестирование

### Способ 1: Зарегистрируйте нового пользователя через UI

1. Откройте ваше приложение: https://sales-ai-trainer.vercel.app/register
2. Зарегистрируйте тестового пользователя
3. Профиль должен появиться автоматически в `salesai_profiles`

### Способ 2: Проверьте через Supabase Dashboard

1. Откройте **Supabase Dashboard → SQL Editor**
2. Выполните запрос:

```sql
-- Проверьте что trigger создан
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Ожидаемый результат:**
```
trigger_name         | event_manipulation | event_object_table | action_statement
---------------------|--------------------|--------------------|------------------
on_auth_user_created | INSERT             | users              | EXECUTE FUNCTION public.handle_new_user()
```

3. Проверьте последние профили:

```sql
SELECT
  id,
  auth_id,
  email,
  first_name,
  last_name,
  role,
  demo_sessions_used,
  demo_minutes_used,
  created_at
FROM salesai_profiles
ORDER BY created_at DESC
LIMIT 5;
```

### Способ 3: Проверьте через CLI

```bash
cd "/Users/dzhechkov/Downloads/Session 05"

# Проверьте статус миграций
supabase migration list

# Должен показать:
# 20250125000000 | 20250125000000 | 2025-01-25 00:00:00
```

## 🎯 Что теперь работает:

### Автоматическое создание профиля при регистрации:

```
Новый пользователь регистрируется
         ↓
Создаётся запись в auth.users
         ↓
🔥 TRIGGER автоматически срабатывает
         ↓
Создаётся компания (если нужно)
         ↓
Создаётся профиль в salesai_profiles
         ↓
✅ Пользователь получает роль demo_user
```

### Что включает профиль:

- ✅ `auth_id` - связь с Supabase Auth
- ✅ `company_id` - автоматически созданная/найденная компания
- ✅ `email, first_name, last_name` - из user metadata
- ✅ `role: 'demo_user'` - по умолчанию
- ✅ `demo_sessions_used: 0` - счётчик использованных сессий
- ✅ `demo_minutes_used: 0` - счётчик использованных минут
- ✅ `settings` - начальные настройки пользователя

## 🔍 Отладка

Если профиль не создаётся автоматически:

### 1. Проверьте логи Supabase

В Supabase Dashboard → Logs → Database Logs

Ищите записи:
```
WARNING: Failed to create profile for user <uuid>: <error message>
```

### 2. Проверьте RLS политики

```sql
-- Должны быть активны следующие политики:
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'salesai_profiles'
  AND policyname IN (
    'Users can insert own profile',
    'Users can see own profile'
  );
```

### 3. Проверьте права trigger функции

```sql
-- Функция должна существовать с SECURITY DEFINER
SELECT
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';
```

## 📝 Важные замечания

1. **Trigger работает на уровне БД** - не зависит от API или фронтенда
2. **Защита от дубликатов** - `ON CONFLICT (auth_id) DO NOTHING`
3. **Обработка ошибок** - не блокирует создание пользователя при сбое
4. **Security Definer** - функция выполняется с правами postgres, обходя RLS

## ✅ Проверка завершена

Теперь каждый новый пользователь автоматически получит профиль с ролью `demo_user`!
