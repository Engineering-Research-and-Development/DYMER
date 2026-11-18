function fieldKey(field) {
  return [
    field.normalizedName || field.name || field.label || '',
    field.tag || '',
    field.type || ''
  ].join('|').toLowerCase();
}

function relationKey(relation) {
  return [
    relation.fieldName || '',
    relation.direction || '',
    relation.targetIndex || '',
    relation.attribute || ''
  ].join('|').toLowerCase();
}

export function mergeFormSchemas(schemas = []) {
  const sources = [];
  const fields = [];
  const relations = [];
  const warnings = [];
  const seenSources = new Set();
  const seenFields = new Set();
  const seenRelations = new Set();

  for (const schema of schemas.filter(Boolean)) {
    if (schema.source) {
      const sourceKey = `${schema.source.type}|${schema.source.sourceFile || ''}`;
      if (!seenSources.has(sourceKey)) {
        seenSources.add(sourceKey);
        sources.push(schema.source);
      }
    }

    for (const field of schema.fields || []) {
      const key = fieldKey(field);
      if (!key || seenFields.has(key)) continue;
      seenFields.add(key);
      fields.push(field);
    }

    for (const relation of schema.relations || []) {
      const key = relationKey(relation);
      if (!key || seenRelations.has(key)) continue;
      seenRelations.add(key);
      relations.push(relation);
    }

    for (const warning of schema.warnings || []) {
      if (!warnings.includes(warning)) warnings.push(warning);
    }
  }

  return { sources, fields, relations, warnings };
}
