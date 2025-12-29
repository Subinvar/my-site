/**
 * Apple-like navigation motion.
 *
 * Здесь собраны ВСЕ ключевые тайминги для:
 *  - десктопного mega-menu (выпадающее подменю в шапке)
 *  - мобильного/бургер-меню
 *  - анимации появления/исчезания текста
 *
 * Это специально вынесено в один файл, чтобы:
 *  - было очевидно, где править скорость
 *  - тайминги были едиными для desktop и mobile
 */

/**
 * Общий множитель скорости.
 *
 * 1 — базовые значения.
 * 2 — в 2 раза медленнее.
 * 3 — в 3 раза медленнее (как сейчас требуется).
 */
export const NAV_MOTION_TIME_SCALE = 3;

/**
 * Небольшая пауза между наведением и началом раскрытия mega-menu (hover intent).
 * Apple делает это, чтобы избежать случайных раскрытий при «пролёте» курсора.
 */
export const DESKTOP_DROPDOWN_HOVER_OPEN_DELAY_MS = 240;

/**
 * После клика по пункту шапки (и навигации) мы временно блокируем hover-раскрытие,
 * пока курсор не будет сдвинут хотя бы на несколько пикселей.
 */
export const DESKTOP_DROPDOWN_HOVER_SUPPRESS_MOVE_PX = 6;

const ms = (base: number) => Math.round(base * NAV_MOTION_TIME_SCALE);

/**
 * Панель mega-menu: раскрытие медленнее, закрытие быстрее.
 */
export const DESKTOP_DROPDOWN_OPEN_MS = ms(420);
export const DESKTOP_DROPDOWN_CLOSE_MS = ms(280);

/**
 * Анимация текста внутри mega-menu:
 * - лёгкая задержка, чтобы панель начала расширяться
 * - каскад (stagger) по пунктам
 * - при закрытии — «растворение» быстрее, чем схлопывание панели
 */
export const DESKTOP_DROPDOWN_TEXT_ENTER_DELAY_MS = ms(90);
export const DESKTOP_DROPDOWN_TEXT_STAGGER_MS = ms(34);
export const DESKTOP_DROPDOWN_TEXT_ENTER_MS = ms(240);
export const DESKTOP_DROPDOWN_TEXT_EXIT_MS = ms(160);

/**
 * Бургер-меню:
 * используем те же ощущения, что и у mega-menu (панель + текст).
 * При желании можно развести значения, но пока держим единым комплектом.
 */
export const BURGER_MENU_OPEN_MS = DESKTOP_DROPDOWN_OPEN_MS;
export const BURGER_MENU_CLOSE_MS = DESKTOP_DROPDOWN_CLOSE_MS;

export const BURGER_MENU_TEXT_ENTER_DELAY_MS = DESKTOP_DROPDOWN_TEXT_ENTER_DELAY_MS;
export const BURGER_MENU_TEXT_STAGGER_MS = ms(12);
export const BURGER_MENU_TEXT_ENTER_MS = DESKTOP_DROPDOWN_TEXT_ENTER_MS;
export const BURGER_MENU_TEXT_EXIT_MS = DESKTOP_DROPDOWN_TEXT_EXIT_MS;
