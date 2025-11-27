import fs from 'node:fs/promises';
import path from 'node:path';

const catalogDir = path.join(process.cwd(), 'content', 'catalog');

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const formatList = (value) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return '—';
  }
  return value.map((item) => cleanText(item)).filter(Boolean).join(', ') || '—';
};

const buildContent = (locale, data) => {
  const isRussian = locale === 'ru';
  const title =
    cleanText(data.title?.[locale]) || cleanText(data.title?.ru) || cleanText(data.slugKey);
  const category = cleanText(data.category) || (isRussian ? 'Без категории' : 'Uncategorized');
  const process = formatList(data.process);
  const base = formatList(data.base);
  const filler = formatList(data.filler);

  const calloutTitle = isRussian ? 'Кратко' : 'Brief';
  const heading = isRussian ? 'Характеристики' : 'Key features';

  if (isRussian) {
    return `# ${title}\n\n{% callout title="${calloutTitle}" %}\n- Категория: ${category}\n- Процессы: ${process}\n- Основа: ${base}\n- Наполнители: ${filler}\n{% /callout %}\n\n## ${heading}\n- **Назначение.** ${title} относится к категории «${category}» и помогает поддерживать стабильную работу литейных цехов.\n- **Применение.**\n  - Перед работой перемешайте продукт и проверьте совместимость с вашей технологией нанесения.\n  - Проведите контрольное нанесение на образцы, чтобы уточнить расход и режимы сушки.\n  - Зафиксируйте параметры, при которых достигается нужная чистота поверхности и стабильность формы.\n- **Что важно учесть.**\n  - Соблюдайте рекомендации по безопасности и вентиляции при приготовлении и нанесении.\n  - Регулярно контролируйте вязкость или плотность и корректируйте растворителем или добавками, если это предусмотрено инструкцией.\n  - Храните продукт в герметичной таре, избегая перепадов температур и попадания влаги.`;
  }

  return `# ${title}\n\n{% callout title="${calloutTitle}" %}\n- Category: ${category}\n- Processes: ${process}\n- Base: ${base}\n- Fillers: ${filler}\n{% /callout %}\n\n## ${heading}\n- **Purpose.** ${title} belongs to the "${category}" line and is built to keep foundry operations stable.\n- **Application.**\n  - Stir the product before use and confirm it matches your application method.\n  - Run a small-scale trial to set the required consumption rate and drying modes.\n  - Record the parameters that deliver the desired surface quality and mold stability.\n- **Good to know.**\n  - Follow safety guidance and provide ventilation during preparation and application.\n  - Monitor viscosity or density regularly and adjust with solvent or additives if the instructions allow.\n  - Store the product in sealed containers, avoiding moisture and temperature swings.`;
};

const main = async () => {
  const entries = await fs.readdir(catalogDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(catalogDir, entry.name, 'index.json');
    try {
      const raw = await fs.readFile(indexPath, 'utf8');
      const data = JSON.parse(raw);

      for (const locale of ['ru', 'en']) {
        const targetPath = path.join(catalogDir, entry.name, 'index', 'content', `${locale}.mdoc`);
        const content = buildContent(locale, data);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, `${content.trim()}\n`);
      }
    } catch (error) {
      console.warn(`Пропускаю ${entry.name}: ${error.message}`);
    }
  }
};

main();
