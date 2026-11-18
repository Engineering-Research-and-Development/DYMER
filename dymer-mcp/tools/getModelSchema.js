import { getFullModel } from '../clients/formsClient.js';
import { extractJsonFormSchema } from '../utils/extractFormFields.js';
import { extractHtmlFormSchema } from '../utils/extractHtmlFormSchema.js';
import { mergeFormSchemas } from '../utils/mergeFormSchemas.js';
import { ToolError } from '../utils/toolError.js';

function normalizeInstances(model) {
  const instances = Array.isArray(model?.instance)
    ? model.instance
    : Array.isArray(model?.instances)
      ? model.instances
      : [];

  return instances.map(item => ({
    index: item?._index ?? item?.index ?? '',
    type: item?._type ?? item?.type ?? ''
  }));
}

function isHtmlFile(file) {
  const contentType = String(
    file?.contentType ?? file?.mimetype ?? file?.mimeType ?? ''
  ).toLowerCase();
  const filename = String(file?.filename ?? file?.name ?? '').toLowerCase();

  return contentType.includes('text/html') || /\.html?$/.test(filename);
}

function getFileContent(file) {
  if (typeof file?.data === 'string') return file.data;
  if (Buffer.isBuffer(file?.data)) return file.data.toString('utf8');
  if (file?.data?.type === 'Buffer' && Array.isArray(file.data.data)) {
    return Buffer.from(file.data.data).toString('utf8');
  }
  return '';
}

export async function getModelSchema({
  dymerUser,
  modelId,
  title,
  index
}) {
  const model = await getFullModel({
    dymerUser,
    modelId,
    title,
    index
  });

  if (!model) {
    throw new ToolError(
      modelId
        ? `Modello DYMER con ID "${modelId}" non trovato`
        : index
          ? `Modello DYMER con indice "${index}" non trovato`
          : `Modello DYMER con titolo "${title}" non trovato`,
      404
    );
  }

  const schemas = [];
  const warnings = [];

  if (model.structure && typeof model.structure === 'object') {
    schemas.push(extractJsonFormSchema(model.structure));
  }

  const files = Array.isArray(model.files) ? model.files : [];
  const htmlFiles = files.filter(isHtmlFile);

  for (const file of htmlFiles) {
    const sourceFile = file?.filename ?? file?.name ?? String(file?._id ?? 'form.html');
    const html = getFileContent(file);

    if (!html) {
      warnings.push(`Il file HTML "${sourceFile}" non contiene dati testuali leggibili`);
      continue;
    }

    schemas.push(extractHtmlFormSchema(html, { sourceFile }));
  }

  if (!model.structure && !htmlFiles.length) {
    warnings.push('Il modello non contiene una structure JSON né file HTML utilizzabili come schema');
  }

  const merged = mergeFormSchemas(schemas);
  const allWarnings = [...new Set([...warnings, ...merged.warnings])];

  return {
    id: String(model._id ?? model.id ?? ''),
    title: model.title ?? '',
    description: model.description ?? '',
    instances: normalizeInstances(model),
    sources: merged.sources,
    fields: merged.fields,
    relations: merged.relations,
    warnings: allWarnings,
    metadata: {
      hasJsonStructure: Boolean(model.structure),
      totalFiles: files.length,
      htmlFiles: htmlFiles.length,
      propertiesAvailable: Boolean(model.properties)
    }
  };
}
