import { load } from 'cheerio';
import { config } from '../config.js';
import { dymerRequest } from './dymerGatewayClient.js';
import { extractDymerData } from '../utils/normalizeDymerResponse.js';


function htmlToPlainText(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const $ = load(raw, { decodeEntities: true });

  return $.root()
    .text()
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRelatedEntity(item) {
  const source = item?._source && typeof item._source === 'object'
    ? item._source
    : item && typeof item === 'object'
      ? item
      : {};

  const rawDescription = String(source.description ?? '');

  return {
    index: String(item?._index ?? source._index ?? source.index ?? ''),
    id: String(item?._id ?? source._id ?? source.id ?? ''),
    title: htmlToPlainText(source.title ?? source.name ?? ''),
    description: htmlToPlainText(rawDescription),
    descriptionHtml: rawDescription,
    status: source.status ?? source.properties?.status ?? '',
    updatedAt: source.updatedAt ?? '',
    score: item?._score ?? null
  };
}

function safeSize(value) {
  const parsed = Number.parseInt(value ?? config.defaultSearchSize, 10);
  return Math.min(config.maxSearchSize, Math.max(1, Number.isFinite(parsed) ? parsed : config.defaultSearchSize));
}

async function searchEntitiesInIndex({
  dymerUser,
  index,
  query,
  page,
  limit
}) {
  const size = safeSize(limit);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const must = [{ term: { _index: index } }];
  const normalizedQuery = String(query ?? '').trim();

  if (normalizedQuery) {
    must.push({
      bool: {
        should: [
          { match: { title: normalizedQuery } },
          { match: { description: normalizedQuery } }
        ],
        minimum_should_match: 1
      }
    });
  }

  const payload = await dymerRequest({
    path: '/api/entities/api/v1/entity/_search',
    method: 'POST',
    body: {
      instance: { index },
      query: { query: { bool: { must } } },
      qoptions: {
        size,
        from: (safePage - 1) * size,
        relations: 'none',
        fields: ['title', 'description', 'status', 'properties', 'updatedAt']
      }
    },
    dymerUser
  });

  const data = extractDymerData(payload);
  const items = Array.isArray(data) ? data
    : Array.isArray(data?.items) ? data.items
      : Array.isArray(data?.hits?.hits) ? data.hits.hits
        : Array.isArray(data?.hits) ? data.hits : [];
  const pageInfo = payload?.extraData ?? payload?.extradata ?? {};
  const rawTotal =
    pageInfo.total ?? pageInfo.totalCount ?? pageInfo.count ??
    payload?.total ?? payload?.totalCount ?? payload?.count ??
    data?.total ?? data?.totalCount ?? data?.count ??
    data?.hits?.total?.value ?? data?.hits?.total;
  const total = Number.isFinite(Number(rawTotal)) ? Number(rawTotal) : items.length;
  console.log('[DYMER MCP] search index result', {
    index, returned: items.length, total,
    pageInfoKeys: Object.keys(pageInfo || {}),
    payloadKeys: payload && typeof payload === 'object' ? Object.keys(payload) : [],
    dataKeys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : []
  });
  return { index, items, total };
}

export async function searchEntities({
  dymerUser,
  index,
  indexes,
  exactTitle,
  query,
  page = 1,
  limit
}) {
  const requestedIndexes = [
    ...(Array.isArray(indexes) ? indexes : []),
    ...(index ? [index] : [])
  ]
    .map(value => String(value).trim())
    .filter(Boolean);

  const uniqueIndexes = [...new Set(requestedIndexes)];
  if (!uniqueIndexes.length) return { total: 0, items: [] };

  const perIndexLimit = exactTitle ? Math.max(safeSize(limit), 20) : safeSize(limit);
  const batches = [];
  const failedIndexes = [];
  const concurrency = 4;

  // Avoid flooding dymer-entities with one request for every published index.
  // Process small groups and tolerate a failure on one index without losing
  // successful exact-title matches returned by the other indexes.
  for (let offset = 0; offset < uniqueIndexes.length; offset += concurrency) {
    const currentIndexes = uniqueIndexes.slice(offset, offset + concurrency);
    const settled = await Promise.allSettled(
      currentIndexes.map(currentIndex =>
        searchEntitiesInIndex({
          dymerUser,
          index: currentIndex,
          query: exactTitle || query,
          page,
          limit: perIndexLimit
        })
      )
    );

    settled.forEach((result, resultIndex) => {
      if (result.status === 'fulfilled') {
        batches.push(result.value);
      } else {
        failedIndexes.push(currentIndexes[resultIndex]);
      }
    });
  }

  let items = batches.flatMap(batch => batch.items || []);
  if (exactTitle) {
    const wanted = String(exactTitle).trim().toLocaleLowerCase();
    items = items.filter(item =>
      htmlToPlainText(item?._source?.title ?? item?.title ?? '')
        .toLocaleLowerCase() === wanted
    );
  }

  const seen = new Set();
  const normalizedItems = items
    .filter(item => {
      const key = `${item?._index ?? ''}|${item?._id ?? ''}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const totalsByIndex = Object.fromEntries(batches.map(batch => [batch.index, Number(batch.total) || 0]));
  console.log('[DYMER MCP] search aggregate', {
    searchedIndexes: uniqueIndexes, failedIndexes, totalsByIndex, returned: normalizedItems.length
  });
  return {
    total: exactTitle ? normalizedItems.length : Object.values(totalsByIndex).reduce((sum, value) => sum + value, 0),
    returned: normalizedItems.length,
    totalsByIndex,
    items: normalizedItems,
    searchedIndexes: uniqueIndexes,
    failedIndexes
  };
}

export async function countEntities({ dymerUser, index, indexes }) {
  const payload = await dymerRequest({
    path: '/api/entities/api/v1/entity/',
    method: 'GET',
    dymerUser
  });
  const data = extractDymerData(payload);
  const allItems = Array.isArray(data) ? data : [];
  const requestedIndexes = [
    ...(Array.isArray(indexes) ? indexes : []),
    ...(index ? [index] : [])
  ].map(value => String(value).trim()).filter(Boolean);
  const uniqueIndexes = [...new Set(requestedIndexes)];
  const filteredItems = uniqueIndexes.length
    ? allItems.filter(item => uniqueIndexes.includes(String(item?._index ?? item?.index ?? item?._source?._index ?? '')))
    : allItems;
  const totalsByIndex = {};
  for (const item of filteredItems) {
    const itemIndex = String(item?._index ?? item?.index ?? item?._source?._index ?? 'unknown');
    totalsByIndex[itemIndex] = (totalsByIndex[itemIndex] || 0) + 1;
  }
  console.log('[DYMER MCP] count entities', {
    allVisible: allItems.length,
    filtered: filteredItems.length,
    requestedIndexes: uniqueIndexes,
    totalsByIndex
  });
  return {
    total: filteredItems.length,
    complete: true,
    countMode: 'full_visible_dataset',
    totalsByIndex,
    requestedIndexes: uniqueIndexes
  };
}


export async function countRelations({ dymerUser, index, indexes }) {
  const requestedIndexes = [
    ...(Array.isArray(indexes) ? indexes : []),
    ...(index ? [index] : [])
  ].map(value => String(value).trim()).filter(Boolean);
  const uniqueIndexes = [...new Set(requestedIndexes)];

  if (!uniqueIndexes.length) {
    const error = new Error('Specificare almeno un indice per contare le relazioni.');
    error.statusCode = 422;
    throw error;
  }

  // Use the existing dymer-entities relationstat endpoint. This avoids one
  // _relations call per entity and keeps the implementation entirely in MCP.
  const payload = await dymerRequest({
    path: '/api/entities/api/v1/entity/relationstat/',
    method: 'GET',
    dymerUser
  });
  const data = extractDymerData(payload);
  const sourceBuckets = Array.isArray(data) ? data : [];
  const requestedSet = new Set(uniqueIndexes);
  const totalsBySourceIndex = Object.fromEntries(uniqueIndexes.map(value => [value, 0]));
  const totalsByRelatedIndex = {};
  let total = 0;

  for (const sourceBucket of sourceBuckets) {
    const sourceIndex = String(sourceBucket?.key ?? '').trim();
    const sourceCount = Number(sourceBucket?.doc_count) || 0;
    const relatedBuckets = Array.isArray(sourceBucket?._index2?.buckets)
      ? sourceBucket._index2.buckets
      : [];

    // All relations whose first endpoint belongs to a requested index.
    if (requestedSet.has(sourceIndex)) {
      total += sourceCount;
      totalsBySourceIndex[sourceIndex] =
        (totalsBySourceIndex[sourceIndex] || 0) + sourceCount;

      for (const relatedBucket of relatedBuckets) {
        const relatedIndex = String(relatedBucket?.key ?? '').trim();
        if (!relatedIndex) continue;
        totalsByRelatedIndex[relatedIndex] =
          (totalsByRelatedIndex[relatedIndex] || 0) +
          (Number(relatedBucket?.doc_count) || 0);
      }
    }

    // Add relations where the requested index is only the second endpoint.
    // Skip requested-to-requested pairs because they were already included by
    // the source bucket and must be counted once.
    if (!requestedSet.has(sourceIndex)) {
      for (const relatedBucket of relatedBuckets) {
        const relatedIndex = String(relatedBucket?.key ?? '').trim();
        if (!requestedSet.has(relatedIndex)) continue;
        const count = Number(relatedBucket?.doc_count) || 0;
        total += count;
        totalsBySourceIndex[relatedIndex] =
          (totalsBySourceIndex[relatedIndex] || 0) + count;
        totalsByRelatedIndex[sourceIndex] =
          (totalsByRelatedIndex[sourceIndex] || 0) + count;
      }
    }
  }

  const result = {
    total,
    complete: true,
    countMode: 'relationstat_unique_visible_buckets',
    requestedIndexes: uniqueIndexes,
    totalsBySourceIndex,
    totalsByRelatedIndex,
    sourceBucketsScanned: sourceBuckets.length
  };

  console.log('[DYMER MCP] count relations via relationstat', result);
  return result;
}

export async function getEntity({ dymerUser, index, id, includeRelations = false }) {
  const params = new URLSearchParams({
    relations: includeRelations ? 'lite' : 'none',
    size: '1'
  });
  if (includeRelations) {
    params.set('rellimit', '10');
    params.set('relfields', 'title,description,status');
  }

  const payload = await dymerRequest({
    path: `/api/entities/api/v1/entity/_search/${encodeURIComponent(index)}/${encodeURIComponent(id)}?${params}`,
    dymerUser
  });
  return extractDymerData(payload);
}

export async function getEntityRelations({
  dymerUser,
  entityId,
  index,
  relatedIndexes,
  page = 1,
  limit
}) {
  const size = safeSize(limit);
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);

  const params = new URLSearchParams({
    from: String((safePage - 1) * size),
    size: String(size),
    fields: 'title,description,status,updatedAt'
  });

  // `index` identifies the source entity in the MCP contract.
  // The DYMER _relations endpoint uses its `index` query parameter instead
  // as an optional filter on the indexes of the related entities. Therefore
  // the source index must not be forwarded as a destination filter.
  const filters = Array.isArray(relatedIndexes)
    ? relatedIndexes
    : typeof relatedIndexes === 'string'
      ? relatedIndexes.split(',')
      : [];

  const normalizedFilters = filters
    .map(value => String(value).trim())
    .filter(Boolean);

  if (normalizedFilters.length > 0) {
    params.set('index', [...new Set(normalizedFilters)].join(','));
  }

  const payload = await dymerRequest({
    path: `/api/entities/api/v1/entity/_relations/${encodeURIComponent(entityId)}?${params}`,
    dymerUser
  });

  const rawItems = extractDymerData(payload);
  const pageInfo = payload?.extraData ?? payload?.extradata ?? {};
  const items = Array.isArray(rawItems)
    ? rawItems.map(normalizeRelatedEntity)
    : [];

  return {
    source: {
      entityId: String(entityId),
      index: String(index ?? '')
    },
    items,
    total: Number.isFinite(Number(pageInfo.total))
      ? Number(pageInfo.total)
      : items.length,
    from: Number.isFinite(Number(pageInfo.from))
      ? Number(pageInfo.from)
      : (safePage - 1) * size,
    size: Number.isFinite(Number(pageInfo.size))
      ? Number(pageInfo.size)
      : size,
    relationsCount:
      pageInfo.relationsCount && typeof pageInfo.relationsCount === 'object'
        ? pageInfo.relationsCount
        : {},
    relatedIndexes: normalizedFilters
  };
}
