# Losing Money — Texas Hold’em Poker

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Многопользовательская онлайн-игра Texas Hold’em Poker с реальным временем. До 6 игроков могут создать или присоединиться к лобби, получать карты, делать ставки и видеть результаты сразу. Есть режим одиночной игры с ботами.


## Видеообзор проекта


[https://youtube.com/your-demo-link](https://youtu.be/P0xbaOfia4I](https://youtu.be/P0xbaOfia4I?si=pCHjOqWlWWfk_6mm))

## Ссылка к вебсайту

[losing-money.vercel.app
](https://losing-money.vercel.app/)
---

## Содержание

1. [Описание проекта](#описание-проекта)  
2. [Установка и запуск](#установка-и-запуск)  
3. [Процесс проектирования и разработки](#процесс-проектирования-и-разработки)  
4. [Уникальные подходы и методологии](#уникальные-подходы-и-методологии)  
5. [Компромиссы и соображения](#компромиссы-и-соображения)  
6. [Известные проблемы и ограничения](#известные-проблемы-и-ограничения)  
7. [Почему этот стек технологий](#почему-этот-стек-технологий)  
8. [Участие в разработке](#участие-в-разработке)  
9. [Лицензия](#лицензия)  

---

## Описание проекта

**Losing Money** — это онлайн-клон Texas Hold’em Poker с реализацией в реальном времени через WebSockets. Игроки подключаются к «комнате» по короткому коду, видят действия друг друга и борются за общий банк. Встроенный режим одиночной игры позволяет играть против простых ботов.

---

## Установка и запуск

### Требования

- Node.js v14 или выше  
- npm (или yarn)  

### Клонирование и установка

```bash
git clone https://github.com/your-username/losing-money.git
cd losing-money
npm install
````

### Переменные окружения

В корне (клиент):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

В папке `server/`:

```env
PORT=4000
CLIENT_URL=http://localhost:3000
```

> **Не** добавляйте файлы `.env*` в систему контроля версий.

### Запуск локально

1. **Запустить сервер**

   ```bash
   cd server
   npm install
   npm run start
   ```
2. **Запустить клиент**

   ```bash
   cd ..
   npm run dev
   ```
3. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## Процесс проектирования и разработки

1. **Сбор требований**

   * Определили основные сценарии: создание/присоединение к комнате, раздача карт, раунды ставок, отображение результатов.
2. **Прототипирование UI/UX**

   * Нарисовали страницы: Home, Rules, Lobby, Game.
   * Выбрали стиль glassmorphism и mobile-first подход.
3. **Frontend**

   * Next.js для маршрутизации и SSR/SSG.
   * Tailwind CSS для стилей, Framer Motion для анимаций, Howler.js для звуков.
4. **Backend и логика реального времени**

   * Отдельный сервер на Express + Socket.IO.
   * Реализация комнат, перемешивания колоды, состояний ставок.
5. **Тестирование и итерации**

   * Локальные игры с несколькими клиентами в разных браузерах.
   * Симуляция медленного соединения и проверка повторного подключения.

---

## Уникальные подходы и методологии

* **Модульная логика колоды**
  Fisher–Yates shuffle и функции deal в отдельном модуле для простоты тестирования и переиспользования.
* **Архитектура на базе комнат Socket.IO**
  Изоляция игровых экземпляров и эффективная рассылка событий.
* **Glassmorphism и отзывчивые анимации**
  Полупрозрачные панели, размытие фона и «пружинные» переходы для UX.
* **Howler.js для звуков**
  Качественные аудиосигналы при нажатиях, раздаче и ставках без блокировки UI.

---

## Компромиссы и соображения

* **Состояние в памяти vs постоянное хранилище**
  Выбрали хранение хода игры в оперативной памяти для быстродействия, но потеряли устойчивость при перезапуске сервера.
* **Ограниченная масштабируемость**
  До 6 игроков на комнату и отсутствие базы данных ограничивают число одновременных комнат.
* **Уровень ИИ ботов**
  Реализован простой rule-based бот, а не сложный вероятностный, чтобы сконцентрироваться на механике реального времени.

---

## Известные проблемы и ограничения

* **Пере-соединение**
  Быстрые переподключения иногда не восстанавливают текущее состояние раунда.
* **Поздние участники**
  Игроки, вошедшие после начала раздачи, не получают историю событий текущей руки.
* **Мобильная верстка**
  На экранах уже 320px возможны незначительные смещения элементов в лобби.

---

## Почему этот стек технологий

* **Next.js**
  Встроенный роутинг, SSR/SSG и отличный DX для React.
* **Tailwind CSS**
  Утилитарные классы для быстрой и консистентной верстки.
* **Socket.IO**
  Полноценная двунаправленная связь с комнатами и автоматическим переподключением.
* **Express**
  Легковесный сервер, хорошо сочетающийся с Socket.IO.
* **Framer Motion**
  Декларативные анимации React для плавного UX.
* **Howler.js**
  Кросс-браузерное воспроизведение звуковых эффектов без блокировки.

---

## Участие в разработке

1. Fork this repository
2. Create your feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes

   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push to your branch

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

---

## Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробностей.

```
```
