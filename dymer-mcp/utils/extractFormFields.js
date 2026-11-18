const FIELD_KEYS = [
  'name',
  'key',
  'id',
  'label',
  'title',
  'type',
  'control',
  'required',
  'placeholder',
  'value'
];

const RELATION_ATTRIBUTES = [
  'data-torelation',
  'data-fromrelation',
  'data-corelation',
  'data-correlation'
];

function scalar(value) {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .replace(/^data\[/, '')
    .replace(/\]$/, '');
}

function collectAttributes(node) {
  const attributes = {};
  const attr = node?.attr && typeof node.attr === 'object' ? node.attr : {};

  for (const key of FIELD_KEYS) {
    if (scalar(node?.[key])) attributes[key] = node[key];
    if (attributes[key] === undefined && scalar(attr?.[key])) attributes[key] = attr[key];
  }

  for (const key of RELATION_ATTRIBUTES) {
    if (scalar(node?.[key])) attributes[key] = node[key];
    if (attributes[key] === undefined && scalar(attr?.[key])) attributes[key] = attr[key];
  }

  return attributes;
}

function relationFromAttributes(attributes, fieldName, label) {
  for (const attribute of RELATION_ATTRIBUTES) {
    const target = attributes[attribute];
    if (!target) continue;

    return {
      fieldName: fieldName || '',
      label: label || '',
      direction: attribute === 'data-fromrelation' ? 'from' : 'to',
      targetIndex: String(target),
      attribute,
      sourceType: 'json-structure',
      sourceFile: null
    };
  }

  return null;
}

export function extractJsonFormSchema(structure) {
  const fields = [];
  const relations = [];
  const seenFields = new Set();
  const seenRelations = new Set();

  function visit(node) {
    if (!node || typeof node !== 'object') return;

    const attributes = collectAttributes(node);
    const name = attributes.name ?? attributes.key ?? attributes.id ?? '';
    const type = attributes.type ?? attributes.control ?? node.tag ?? node.node ?? '';
    const label = attributes.label ?? attributes.title ?? '';

    if (name || label) {
      const normalizedName = normalizeName(name || label);
      const field = {
        name: String(name || ''),
        normalizedName,
        label: String(label || ''),
        tag: String(node.tag ?? ''),
        type: String(type || ''),
        required: Boolean(attributes.required),
        hidden: String(type).toLowerCase() === 'hidden',
        placeholder: String(attributes.placeholder ?? ''),
        sourceType: 'json-structure',
        sourceFile: null
      };

      const fieldKey = `${field.normalizedName}|${field.type}`.toLowerCase();
      if (!seenFields.has(fieldKey)) {
        seenFields.add(fieldKey);
        fields.push(field);
      }

      const relation = relationFromAttributes(attributes, field.name, field.label);
      if (relation) {
        const relationKey = `${relation.fieldName}|${relation.attribute}|${relation.targetIndex}`.toLowerCase();
        if (!seenRelations.has(relationKey)) {
          seenRelations.add(relationKey);
          relations.push(relation);
        }
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'attr') continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }

  visit(structure);

  return {
    source: {
      type: 'json-structure',
      sourceFile: null
    },
    fields,
    relations,
    warnings: []
  };
}

export function extractFormFields(structure) {
  return extractJsonFormSchema(structure).fields;
}
