import { dymerRequest } from './dymerGatewayClient.js';
import { extractDymerData, asArray } from '../utils/normalizeDymerResponse.js';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getModelId(model) {
  return String(model?._id ?? model?.id ?? '');
}

function getInstances(model) {
  return Array.isArray(model?.instance)
    ? model.instance
    : Array.isArray(model?.instances)
      ? model.instances
      : [];
}

function modelMatches(model, { modelId, title, index }) {
  // Strict priority: when an ID is supplied, only that exact document may match.
  if (modelId) {
    return getModelId(model) === String(modelId);
  }

  // If no ID is supplied, an exact physical index has priority over the title.
  if (index) {
    const wantedIndex = normalize(index);

    return getInstances(model).some(instance =>
      normalize(instance?._index ?? instance?.index) === wantedIndex
    );
  }

  // Title matching is allowed only when neither ID nor index was supplied.
  if (title) {
    return normalize(model?.title) === normalize(title);
  }

  return false;
}

export async function getModelDetails({ dymerUser, modelId, title }) {
  const params = new URLSearchParams();
  if (modelId) params.set('_id', modelId);
  if (title) params.set('title', title);
  const suffix = params.size ? `?${params.toString()}` : '';

  const payload = await dymerRequest({
    path: `/api/forms/api/v1/form/dettagliomodel${suffix}`,
    dymerUser
  });

  return asArray(extractDymerData(payload));
}

export async function getFullModels({ dymerUser }) {
  const payload = await dymerRequest({
    path: '/api/forms/api/v1/form',
    dymerUser
  });

  return asArray(extractDymerData(payload));
}

export async function getFullModel({
  dymerUser,
  modelId,
  title,
  index
}) {
  const models = await getFullModels({ dymerUser });

  return models.find(model =>
    modelMatches(model, { modelId, title, index })
  ) ?? null;
}
