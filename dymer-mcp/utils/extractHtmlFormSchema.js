import { load } from 'cheerio';

const RELATION_ATTRIBUTES = [
  'data-torelation',
  'data-fromrelation',
  'data-corelation',
  'data-correlation'
];

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/^data\[/, '')
    .replace(/\]$/, '');
}

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function findLabel($, element, id) {
  if (id) {
    const explicit = cleanText($(`label[for="${id.replace(/"/g, '\\"')}"]`).first().text());
    if (explicit) return explicit;
  }

  const parentLabel = cleanText(element.closest('label').first().text());
  if (parentLabel) return parentLabel;

  return cleanText(
    element.attr('data-label') ||
    element.attr('aria-label') ||
    element.attr('title') ||
    element.attr('placeholder') ||
    ''
  );
}

function findRelationContext(element) {
  let current = element;

  for (let depth = 0; depth <= 4 && current?.length; depth += 1) {
    const label = cleanText(current.children('label').first().text()) ||
      cleanText(current.find('label').first().text());

    const description = cleanText(
      current.children('small, .form-text').first().text()
    );

    if (label || description) {
      return {
        label,
        description,
        containerTag: String(current.get(0)?.tagName || '').toLowerCase(),
        containerId: cleanText(current.attr('id')),
        containerClass: cleanText(current.attr('class'))
      };
    }

    current = current.parent();
  }

  return {
    label: '',
    description: '',
    containerTag: String(element.get(0)?.tagName || '').toLowerCase(),
    containerId: cleanText(element.attr('id')),
    containerClass: cleanText(element.attr('class'))
  };
}

function extractRelation(element, fieldName, fieldLabel, sourceFile) {
  for (const attribute of RELATION_ATTRIBUTES) {
    const target = element.attr(attribute);
    if (!target) continue;

    const context = findRelationContext(element);

    return {
      fieldName: fieldName || '',
      label: fieldLabel || context.label || '',
      description: context.description,
      direction: attribute === 'data-fromrelation' ? 'from' : 'to',
      targetIndex: String(target),
      attribute,
      containerTag: context.containerTag,
      containerId: context.containerId,
      containerClass: context.containerClass,
      sourceType: 'html-file',
      sourceFile
    };
  }

  return null;
}

export function extractHtmlFormSchema(html, { sourceFile = null } = {}) {
  const warnings = [];

  if (typeof html !== 'string' || !html.trim()) {
    return {
      source: { type: 'html-file', sourceFile },
      fields: [],
      relations: [],
      warnings: ['File HTML vuoto o non testuale']
    };
  }

  const $ = load(html, { decodeEntities: true });
  const fields = [];
  const relations = [];
  const seenFields = new Set();
  const seenRelations = new Set();

  $('input, select, textarea').each((_index, rawElement) => {
    const element = $(rawElement);
    const tag = String(rawElement.tagName || '').toLowerCase();
    const id = cleanText(element.attr('id'));
    const name = cleanText(element.attr('name') || id);
    const type = cleanText(element.attr('type') || tag);
    const label = findLabel($, element, id) || name || id;
    const normalizedName = normalizeName(name || id || label);

    if (!normalizedName && !label) return;

    const field = {
      name,
      normalizedName,
      label,
      tag,
      type,
      required: element.is('[required]'),
      hidden: type.toLowerCase() === 'hidden' || element.is('[hidden]'),
      placeholder: cleanText(element.attr('placeholder')),
      sourceType: 'html-file',
      sourceFile
    };

    const fieldKey = `${field.normalizedName}|${field.tag}|${field.type}|${sourceFile || ''}`;
    if (!seenFields.has(fieldKey)) {
      seenFields.add(fieldKey);
      fields.push(field);
    }

    const relation = extractRelation(element, name, label, sourceFile);
    if (relation) {
      const relationKey = `${relation.fieldName}|${relation.attribute}|${relation.targetIndex}|${sourceFile || ''}`;
      if (!seenRelations.has(relationKey)) {
        seenRelations.add(relationKey);
        relations.push(relation);
      }
    }
  });

  $('[data-torelation], [data-fromrelation], [data-corelation], [data-correlation]').each(
    (_index, rawElement) => {
      const element = $(rawElement);
      const fieldName = cleanText(element.attr('name') || element.attr('id'));
      const label = findLabel($, element, cleanText(element.attr('id')));
      const relation = extractRelation(element, fieldName, label, sourceFile);
      if (!relation) return;

      const relationKey = `${relation.fieldName}|${relation.attribute}|${relation.targetIndex}|${sourceFile || ''}`;
      if (!seenRelations.has(relationKey)) {
        seenRelations.add(relationKey);
        relations.push(relation);
      }
    }
  );

  if (!fields.length) warnings.push('Nessun input, select o textarea rilevato nel file HTML');

  return {
    source: { type: 'html-file', sourceFile },
    fields,
    relations,
    warnings
  };
}
