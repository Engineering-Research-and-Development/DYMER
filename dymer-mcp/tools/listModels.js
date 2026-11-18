import { getModelDetails } from '../clients/formsClient.js';

export async function listModels({ dymerUser }) {
  const models = await getModelDetails({ dymerUser });
  return {
    models: models.map((model) => ({
      id: String(model._id ?? model.id ?? ''),
      title: model.title ?? '',
      instances: (model.instance ?? []).map((item) => ({
        index: item._index ?? item.index ?? '',
        type: item._type ?? item.type ?? ''
      }))
    }))
  };
}
