const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const SEARCH_VERBS = [
    'mostra', 'mostrami', 'elenca', 'cerca', 'trova', 'visualizza',
    'dammi', 'restituisci', 'indicami', 'quali', 'disponibili',
    'dettaglio', 'dettagli', 'relazione', 'relazioni', 'collegamenti',
    'descrizione', 'descrivi', 'qual e', 'quale e'
];

const DATA_WORDS = [
    'dymer', 'catalogo', 'cataloghi', 'modello', 'modelli', 'model', 'models',
    'schema', 'schemi', 'struttura', 'campi', 'entity', 'entities',
    'entita', 'entità', 'indice', 'indici', 'relazione', 'relazioni',
    'dettaglio', 'dettagli', 'descrizione', 'titolo', 'service', 'services', 'servizio', 'servizi',
    'project', 'projects', 'organization', 'organizations', 'publication',
    'publications', 'dih', 'edih', 'dataset', 'datasets'
];

const GENERIC_CATALOG_WORDS = new Set([
    'catalogo', 'cataloghi', 'modello', 'modelli', 'model', 'models',
    'schema', 'schemi', 'struttura', 'campi', 'entity', 'entities',
    'entita', 'indice', 'indici', 'tipo', 'tipi', 'dymer', 'data',
    'the', 'and'
]);

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[_/\\-]+/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function singularize(value) {
    const word = normalizeText(value);

    if (word.endsWith('ies') && word.length > 3) {
        return `${word.slice(0, -3)}y`;
    }

    if (word === 'service') return 'service';
    if (word.endsWith('services')) {
        return word.replace(/services$/, 'service');
    }

    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
        return word.slice(0, -1);
    }

    return word;
}

function clampLimit(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed)
        ? Math.min(MAX_LIMIT, Math.max(1, parsed))
        : DEFAULT_LIMIT;
}

function extractRequestedLimit(prompt) {
    const text = String(prompt || '');
    const patterns = [
        /(?:mostrami|mostra|elenca|cerca|trova|visualizza|dammi|restituisci)\s+(?:i\s+titoli\s+di\s+)?(\d+)/i,
        /(?:titoli?\s+di|elenco\s+di)\s+(\d+)/i,
        /(?:primi|prime)\s+(\d+)/i,
        /(?:limit|limite)\s*[:=]?\s*(\d+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return clampLimit(match[1]);
    }

    return DEFAULT_LIMIT;
}

function extractSearchQuery(prompt) {
    const text = String(prompt || '').trim();
    const patterns = [
        /(?:relativi?|relative|riguardanti)\s+(?:a|ad|al|alla|all')\s+(.+?)(?:\s+in\s+dymer)?(?:[.?!]|$)/i,
        /(?:che\s+parlano|che\s+parli)\s+(?:di|del|della)\s+(.+?)(?:[.?!]|$)/i,
        /(?:contenenti?|contengono)\s+(.+?)(?:[.?!]|$)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1].trim();
    }

    return '';
}


function extractRequestedTitle(prompt) {
    const text = String(prompt || '').trim();
    const quoted = text.match(/(?:con|dal|il)\s+titolo\s*[=:]?\s*["“”']([^"“”']+)["“”']/i);
    if (quoted?.[1]) return quoted[1].trim();

    const genericQuoted = text.match(/["“]([^"”]+)["”]/);
    if (genericQuoted?.[1] && /\b(entity|entita|titolo)\b/i.test(text)) {
        return genericQuoted[1].trim();
    }

    return '';
}

function isEntityByTitleRequest(text) {
    const normalized = normalizeText(text);
    return Boolean(extractRequestedTitle(text)) &&
        /\b(entity|entities|entita)\b/.test(normalized) &&
        /\b(descrizione|descrivi|qual e|quale e|mostra|mostrami|cerca|trova|dettaglio)\b/.test(normalized);
}

function getPublishedIndexes(models) {
    const indexes = [];
    for (const model of Array.isArray(models) ? models : []) {
        const instances = Array.isArray(model?.instances)
            ? model.instances
            : Array.isArray(model?.instance)
                ? model.instance
                : [];
        for (const instance of instances) {
            const index = String(instance?.index ?? instance?._index ?? '').trim();
            if (index && !indexes.includes(index)) indexes.push(index);
        }
    }
    return indexes;
}

function extractEntityId(prompt) {
    const text = String(prompt || '');
    const patterns = [
        /(?:entity|entita|entità)\s+(?:con\s+)?(?:id|identificativo)?\s*[:#]?\s*([a-z0-9][a-z0-9._:-]{5,})/i,
        /(?:id|identificativo)\s*[:#]?\s*([a-z0-9][a-z0-9._:-]{5,})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1];
    }

    return '';
}

function isModelsRequest(text) {
    const normalized = normalizeText(text);
    const hasModelWord = /\b(modell[oi]|models?|catalogh[oi]|forms?)\b/.test(normalized);
    const hasVerb = SEARCH_VERBS.some(word => normalized.includes(word));
    const asksSchema = /\b(schema|schemi|struttura|campi|proprieta)\b/.test(normalized);
    return hasModelWord && hasVerb && !asksSchema;
}

function isSchemaRequest(text) {
    const normalized = normalizeText(text);
    return /\b(schema|schemi|struttura|campi|proprieta)\b/.test(normalized);
}

function isRelationsRequest(text) {
    const normalized = normalizeText(text);
    return /\b(relazione|relazioni|collegamento|collegamenti|correlat[oi]|collegat[oi])\b/.test(normalized);
}

function isEntityDetailRequest(text) {
    const normalized = normalizeText(text);
    return /\b(dettaglio|dettagli|detail|apri|completo|completa)\b/.test(normalized) &&
        /\b(entity|entita|id|identificativo)\b/.test(normalized);
}

function looksLikeDymerDataRequest(text) {
    if (isEntityByTitleRequest(text)) return true;

    const normalized = normalizeText(text);

    const hasVerb = SEARCH_VERBS.some(word =>
        normalized.includes(normalizeText(word))
    );

    const hasDataWord = DATA_WORDS.some(word =>
        normalized.includes(normalizeText(word))
    );

    const hasExplicitDymerContext =
        /\bdymer\b/.test(normalized);

    const hasStrongDataIntent =
        isModelsRequest(text) ||
        isSchemaRequest(text) ||
        isRelationsRequest(text) ||
        isEntityDetailRequest(text);

    return (
        hasDataWord &&
        (
            hasVerb ||
            hasExplicitDymerContext ||
            hasStrongDataIntent
        )
    );
}

function getCatalogAliases(model) {
    const aliases = new Set();
    const title = normalizeText(model?.title);
    if (title) aliases.add(title);

    for (const instance of model?.instances || model?.instance || []) {
        const index = normalizeText(instance?.index || instance?._index);
        if (index) aliases.add(index);
    }

    for (const alias of [...aliases]) {
        const singular = singularize(alias);
        aliases.add(singular);
        aliases.add(`${singular}s`);

        for (const token of alias.split(' ')) {
            const normalizedToken = singularize(token);
            if (normalizedToken.length >= 3 && !GENERIC_CATALOG_WORDS.has(normalizedToken)) {
                aliases.add(normalizedToken);
                aliases.add(`${normalizedToken}s`);
            }
        }
    }

    return [...aliases].filter(Boolean);
}

function getModelIdentity(model) {
    const title = normalizeText(model?.title);
    const instances = Array.isArray(model?.instances)
        ? model.instances
        : Array.isArray(model?.instance)
            ? model.instance
            : [];

    const indexes = instances
        .map(instance => normalizeText(instance?.index ?? instance?._index))
        .filter(Boolean);

    return {
        model,
        title,
        indexes,
        index: indexes[0] || '',
        modelId: model?.id || model?._id || ''
    };
}

function toCatalogCandidate(identity, matchType, alias = '') {
    return {
        index: identity.index,
        title: identity.model?.title || identity.index,
        modelId: identity.modelId,
        alias: alias || identity.index || identity.title,
        matchType
    };
}

function uniqueCandidates(candidates) {
    const seen = new Set();

    return candidates.filter(candidate => {
        const key = `${candidate.modelId}|${candidate.index}|${candidate.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function resolveCatalog(prompt, models) {
    const normalizedPrompt = ` ${normalizeText(prompt)} `;
    const identities = (Array.isArray(models) ? models : [])
        .map(getModelIdentity)
        .filter(identity => identity.index);

    // 1. Prefer an explicit full model title. Longer titles win, so
    // "Business Service" is resolved before the generic token "service".
    const exactTitleMatches = uniqueCandidates(
        identities
            .filter(identity =>
                identity.title && normalizedPrompt.includes(` ${identity.title} `)
            )
            .map(identity => toCatalogCandidate(identity, 'exact-title', identity.title))
    ).sort((left, right) =>
        normalizeText(right.title).length - normalizeText(left.title).length
    );

    if (exactTitleMatches.length > 0) {
        const longestLength = normalizeText(exactTitleMatches[0].title).length;
        const longestMatches = exactTitleMatches.filter(candidate =>
            normalizeText(candidate.title).length === longestLength
        );

        const distinctTitleIndexes = new Map();
        for (const candidate of longestMatches) {
            if (!distinctTitleIndexes.has(candidate.index)) {
                distinctTitleIndexes.set(candidate.index, candidate);
            }
        }

        const titleCandidates = [...distinctTitleIndexes.values()];
        if (titleCandidates.length === 1) return titleCandidates[0];
        if (titleCandidates.length > 1) {
            return {
                ambiguous: true,
                matchType: 'exact-title',
                candidates: titleCandidates
            };
        }
    }

    // 2. If no full title is present, use an exact physical index.
    const exactIndexMatches = uniqueCandidates(
        identities.flatMap(identity =>
            identity.indexes
                .filter(index => normalizedPrompt.includes(` ${index} `))
                .map(index => toCatalogCandidate(identity, 'exact-index', index))
        )
    );

    const exactIndexes = new Map();
    for (const candidate of exactIndexMatches) {
        if (!exactIndexes.has(candidate.index)) {
            exactIndexes.set(candidate.index, candidate);
        }
    }

    const exactIndexCandidates = [...exactIndexes.values()];
    if (exactIndexCandidates.length === 1) return exactIndexCandidates[0];
    if (exactIndexCandidates.length > 1) {
        return {
            ambiguous: true,
            matchType: 'exact-index',
            candidates: exactIndexCandidates
        };
    }

    // 3. Alias/token matching is allowed only when it identifies one index.
    const aliasMatches = uniqueCandidates(
        identities.flatMap(identity =>
            getCatalogAliases(identity.model)
                .map(normalizeText)
                .filter(Boolean)
                .filter(alias =>
                    normalizedPrompt.includes(` ${alias} `) ||
                    normalizedPrompt.includes(` ${singularize(alias)} `)
                )
                .map(alias => toCatalogCandidate(identity, 'alias', alias))
        )
    );

    const aliasIndexes = new Map();
    for (const candidate of aliasMatches) {
        if (!aliasIndexes.has(candidate.index)) {
            aliasIndexes.set(candidate.index, candidate);
        }
    }

    const aliasCandidates = [...aliasIndexes.values()];
    if (aliasCandidates.length === 1) return aliasCandidates[0];
    if (aliasCandidates.length > 1) {
        return {
            ambiguous: true,
            matchType: 'alias',
            candidates: aliasCandidates
        };
    }

    return null;
}

function missingDataIntent(reason, prompt) {
    return {
        matched: false,
        dymerDataRequest: true,
        reason,
        prompt
    };
}

function resolveMcpIntent(prompt, models = []) {
    const text = String(prompt || '').trim();

    if (!text) {
        return { matched: false, dymerDataRequest: false, reason: 'empty_prompt' };
    }

    if (isEntityByTitleRequest(text)) {
        const exactTitle = extractRequestedTitle(text);
        const indexes = getPublishedIndexes(models);

        if (!indexes.length) {
            return missingDataIntent('catalogs_unavailable_for_title_search', text);
        }

        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'search_entities',
            arguments: {
                indexes,
                exactTitle,
                query: exactTitle,
                page: 1,
                limit: MAX_LIMIT
            },
            matchMode: 'exact-title',
            prompt: text
        };
    }

    const catalog = resolveCatalog(text, models);
    const entityId = extractEntityId(text);

    if (catalog?.ambiguous) {
        return {
            matched: false,
            dymerDataRequest: true,
            reason: 'catalog_ambiguous',
            candidates: catalog.candidates,
            prompt: text
        };
    }


    if (isEntityDetailRequest(text)) {
        if (!catalog) return missingDataIntent('catalog_required_for_entity', text);
        if (!entityId) return missingDataIntent('entity_id_required', text);

        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'get_entity',
            arguments: {
                index: catalog.index,
                id: entityId,
                includeRelations: false
            },
            catalog,
            prompt: text
        };
    }

    if (isSchemaRequest(text)) {
        if (!catalog) return missingDataIntent('model_required_for_schema', text);

        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'get_model_schema',
            arguments: catalog.modelId
                ? { modelId: catalog.modelId, title: catalog.title }
                : { title: catalog.title },
            catalog,
            prompt: text
        };
    }

    if (isRelationsRequest(text)) {
        if (!catalog) return missingDataIntent('catalog_required_for_relations', text);
        if (!entityId) return missingDataIntent('entity_id_required_for_relations', text);

        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'get_entity_relations',
            arguments: {
                index: catalog.index,
                entityId,
                page: 1,
                limit: extractRequestedLimit(text)
            },
            catalog,
            prompt: text
        };
    }

    if (isModelsRequest(text)) {
        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'list_models',
            arguments: {},
            requestedLimit: extractRequestedLimit(text),
            prompt: text
        };
    }

    if (catalog && looksLikeDymerDataRequest(text)) {
        return {
            matched: true,
            dymerDataRequest: true,
            serverId: 'dymer',
            tool: 'search_entities',
            arguments: {
                index: catalog.index,
                query: extractSearchQuery(text),
                page: 1,
                limit: extractRequestedLimit(text)
            },
            catalog,
            prompt: text
        };
    }

    const dymerDataRequest = looksLikeDymerDataRequest(text);
    return {
        matched: false,
        dymerDataRequest,
        reason: dymerDataRequest ? 'catalog_not_resolved' : 'unsupported_intent'
    };
}

module.exports = {
    resolveMcpIntent,
    resolveCatalog,
    looksLikeDymerDataRequest,
    extractRequestedLimit,
    extractSearchQuery,
    extractEntityId,
    extractRequestedTitle,
    isEntityByTitleRequest,
    normalizeText
};
