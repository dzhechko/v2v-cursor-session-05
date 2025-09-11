# 🔧 ДЕТАЛЬНЫЙ ПЛАН ИСПРАВЛЕНИЯ КРИТИЧЕСКИХ ПРОБЛЕМ

## PHASE 1: DATABASE INTEGRATION (КРИТИЧНО)

### 1.1 Создание Profile Creation API

**Создать**: `frontend/app/api/profile/create/route.ts`
```typescript
// POST /api/profile/create
// Создает профиль пользователя в salesai_profiles после Supabase auth
// Input: { auth_id, email, first_name, last_name, company_name, role, position, phone, team_size }
// Output: { profile: { id, ... } }
```

### 1.2 Модификация Auth Callback

**Изменить**: `frontend/app/auth/callback/route.ts`
- После успешного `exchangeCodeForSession`
- Извлечь user metadata из Supabase auth
- Вызвать `/api/profile/create` для создания полного профиля

### 1.3 Модификация Registration

**Изменить**: `frontend/app/register/page.tsx`
- Добавить поля: position, phone, team_size (согласно документации)
- Сохранить данные в Supabase auth metadata при signUp
- Убрать "Demo Mode" notice

### 1.4 Database Schema Execution

**Выполнить**: `infra/supabase/setup.sql` в Supabase SQL Editor
- Создать все необходимые таблицы
- Настроить RLS policies
- Создать индексы и triggers

## PHASE 2: API KEY MANAGEMENT SYSTEM (КРИТИЧНО)

### 2.1 Settings Page Creation

**Создать**: `frontend/app/settings/page.tsx`
- Форма для ввода ElevenLabs API Key & Agent ID
- Форма для ввода OpenAI API Key
- Validation ключей с live testing
- Encrypted storage в salesai_api_keys

### 2.2 API Key Management Backend

**Создать**: `frontend/app/api/api-keys/route.ts`
```typescript
// GET /api/api-keys - получить ключи пользователя (encrypted)
// POST /api/api-keys - сохранить/обновить ключи
// DELETE /api/api-keys/{service} - удалить ключ для сервиса
```

### 2.3 Mandatory Setup Flow

**Создать**: `frontend/app/setup/page.tsx`
- Онбординг страница для новых пользователей
- Пошаговый setup: Profile completion → API keys → First session

**Изменить**: `frontend/app/dashboard/page.tsx`
- Проверка наличия профиля и API ключей
- Редирект на /setup если что-то отсутствует

### 2.4 Session Blocking Logic

**Изменить**: `frontend/app/session/page.tsx`
- Проверка API ключей перед созданием сессии
- Блокировка с уведомлением если ключи не настроены
- Редирект на /settings для настройки

## PHASE 3: GOAL-BASED PERSONALIZED ANALYSIS

### 3.1 Pre-Session Goal Collection

**Создать**: `frontend/app/session-setup/page.tsx`
- Форма выбора целей улучшения:
  - Opening & Rapport Building
  - Needs Discovery
  - Product Presentation  
  - Objection Handling
  - Closing Techniques
- Свободный текст для специфических целей
- Сохранение в session metadata

### 3.2 Session Goals Integration

**Изменить**: `frontend/app/session/page.tsx`
- Интегрировать session-setup в workflow
- Передавать цели в VoiceSessionInterface
- Сохранять goals в session creation API

### 3.3 Personalized GPT-4 Analysis

**Изменить**: `frontend/app/api/session/analyze/route.ts`
- Расширить промпт для включения:
  - Пользовательских целей
  - Профиль пользователя (роль, компания, опыт)
  - Персонализированные рекомендации
- Добавить goal-specific scoring

### 3.4 Enhanced Analysis Display

**Изменить**: `frontend/app/session/[id]/results/page.tsx`
- Показывать достижение целей
- Goal-specific feedback sections
- Персонализированные next steps

## PHASE 4: USER EXPERIENCE REDESIGN

### 4.1 Proper Registration Flow

**Новый flow**:
```
1. Landing Page → Register
2. Registration Form (расширенная с всеми полями)
3. Email Verification Required
4. Setup Page (профиль + API keys)
5. Dashboard (полнофункциональный)
6. Session Setup (цели) → Voice Session → Results
```

### 4.2 Email Verification Handling

**Создать**: `frontend/app/verify-email/page.tsx`
- Страница ожидания верификации
- Resend email functionality
- Auto-redirect после верификации

### 4.3 Progressive Profile Completion

**Создать**: `frontend/app/profile-completion/page.tsx`
- Пошаговое заполнение отсутствующих данных
- Прогресс бар completion
- Incentives для завершения профиля

## 🎯 КОНКРЕТНЫЕ ФАЙЛЫ ДЛЯ ИЗМЕНЕНИЯ

### Критичные изменения:

1. `frontend/app/api/profile/create/route.ts` (новый)
2. `frontend/app/auth/callback/route.ts` (изменить)
3. `frontend/app/register/page.tsx` (расширить)
4. `frontend/app/settings/page.tsx` (новый)
5. `frontend/app/api/api-keys/route.ts` (новый)
6. `frontend/app/dashboard/page.tsx` (добавить проверки)
7. `frontend/app/session/page.tsx` (добавить валидацию)
8. `frontend/app/api/session/analyze/route.ts` (персонализация)

### Средние приоритеты:

9. `frontend/app/session-setup/page.tsx` (новый)
10. `frontend/app/setup/page.tsx` (новый)
11. `frontend/app/session/[id]/results/page.tsx` (улучшить)

## 📊 ОЦЕНКА ВРЕМЕНИ

- **Phase 1**: 4-6 часов (критично)
- **Phase 2**: 6-8 часов (критично)  
- **Phase 3**: 4-5 часов (важно)
- **Phase 4**: 3-4 часов (улучшение UX)

**Общий объем**: 17-23 часа работы для полного соответствия документации.

**Рекомендация**: Начать с Phase 1 и 2 как критично важных для правильной работы приложения согласно техническим требованиям.
