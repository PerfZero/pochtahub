# PochtaHub Frontend

React приложение для системы доставки.

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Сборка для production

```bash
npm run build
```

## Структура

- `/calculate` - Расчет стоимости доставки
- `/order` - Оформление заказа
- `/confirmation/:orderId` - Подтверждение заказа
- `/login` - Вход
- `/register` - Регистрация
- `/cabinet` - Личный кабинет

## API

API находится в `src/api.js`. По умолчанию используется прокси на `http://localhost:8000/api`

Для production установите переменную окружения:
```
VITE_API_URL=http://109.172.46.96:8000/api
```
