const mcpAgentToolService = require('../mcp/mcpAgentToolService');

const LIMITS = Object.freeze({
    sourceEntities: 5,
    relationsPerEntity: 20,
    targetEntities: 10,
    maxToolCalls: 12
});

function createError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
}

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
    if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
    if (word === 'service') return 'service';
    if (word.endsWith('services')) return word.replace(/services$/, 'service');
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
    return word;
}

function canonicalCatalogTerm(value) {
    const normalized = singularize(value);
    const aliases = {
        servizio: 'service',
        servizi: 'service',
        service: 'service',
        progetto: 'project',
        progetti: 'project',
        project: 'project',
        organizzazione: 'organization',
        organizzazioni: 'organization',
        organisation: 'organization',
        organisations: 'organization',
        organization: 'organization',
        organizations: 'organization',
        modello: 'model',
        modelli: 'model',
        catalogo: 'model',
        cataloghi: 'model',
        entita: 'entity',
        entities: 'entity',
        entity: 'entity'
    };

    return aliases[normalized] || normalized;
}

function extractMcpResult(callResult) {
    const structured = callResult?.result?.structuredContent;
    if (structured && typeof structured === 'object') return structured;

    const content = callResult?.result?.content;
    if (Array.isArray(content)) {
        const text = content
            .filter(item => item?.type === 'text')
            .map(item => item.text)
            .join('\n');
        if (text) {
            try { return JSON.parse(text); }
            catch { return { text }; }
        }
    }
    return {};
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_match, code) =>
            String.fromCodePoint(Number(code))
        );
}

function plainText(value) {
    return decodeHtmlEntities(value)
        .replace(/<br\s*\/?\s*>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function compactDescription(value, maxLength = 500) {
    const text = plainText(value);
    if (!text || text.length <= maxLength) return text;

    const compact = text.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
    return `${compact}...`;
}

function compactEntity(item) {
    const source = item?._source || item || {};
    return {
        id: String(item?._id || source._id || source.id || ''),
        index: String(item?._index || source._index || source.index || ''),
        title: plainText(source.title || source.name || ''),
        description: plainText(source.description || ''),
        status: source.status || source.properties?.status || '',
        updatedAt: source.updatedAt || ''
    };
}

function modelDescriptors(models) {
    return (Array.isArray(models) ? models : []).flatMap(model => {
        const title = String(model?.title || '').trim();
        const normalizedTitle = normalizeText(title);
        const instances = Array.isArray(model?.instances)
            ? model.instances
            : Array.isArray(model?.instance)
                ? model.instance
                : [];

        return instances.map(instance => {
            const index = String(instance?.index ?? instance?._index ?? '').trim();
            const normalizedIndex = normalizeText(index);
            const titleTokens = normalizedTitle.split(' ').filter(token => token.length >= 3);
            const aliases = new Set([
                normalizedTitle,
                normalizedIndex,
                singularize(normalizedTitle),
                singularize(normalizedIndex),
                ...titleTokens,
                ...titleTokens.map(singularize)
            ]);

            return {
                modelId: String(model?.id ?? model?._id ?? ''),
                title,
                index,
                aliases: [...aliases].filter(Boolean)
            };
        }).filter(item => item.index);
    });
}

function findCatalogMentions(prompt, descriptors) {
    const normalizedPrompt = ` ${normalizeText(prompt)} `;
    const mentions = [];

    for (const descriptor of descriptors) {
        let best = null;
        for (const alias of descriptor.aliases) {
            const position = normalizedPrompt.indexOf(` ${alias} `);
            if (position < 0) continue;
            const score = alias.length;
            if (!best || score > best.score) best = { alias, position, score };
        }
        if (best) mentions.push({ ...descriptor, ...best });
    }

    mentions.sort((left, right) => left.position - right.position || right.score - left.score);
    return mentions;
}

function familyIndexes(term, descriptors) {
    const normalizedTerm = canonicalCatalogTerm(term);
    if (!normalizedTerm) return [];

    return [...new Set(
        descriptors
            .filter(descriptor => descriptor.aliases.some(alias =>
                canonicalCatalogTerm(alias) === normalizedTerm ||
                canonicalCatalogTerm(alias.split(' ').pop()) === normalizedTerm
            ))
            .map(descriptor => descriptor.index)
    )];
}

function normalizeTopic(value) {
    return String(value || '')
        .trim()
        .replace(/^(?:il|lo|la|i|gli|le|un|uno|una|l['’])\s*/i, '')
        .replace(/^(?:al|allo|alla|ai|agli|alle|all['’])\s*/i, '')
        .replace(/^(?:nel|nello|nella|nei|negli|nelle|nell['’])\s*/i, '')
        .trim();
}

function detectTopicOperator(prompt) {
    const normalized = normalizeText(prompt);

    if (/\b(?:oppure|o)\b/.test(normalized)) return 'OR';
    if (/\b(?:e|ed|sia)\b/.test(normalized)) return 'AND';
    return 'OR';
}

function extractTopics(prompt) {
    const text = String(prompt || '');
    const boundary =
        String.raw`(?=,|\.|\?|;|\b(?:ci sono|e quali|e mostrami|e indicami|e elencami|e trova|mostrami|indicami|elencami|trova)\b|$)`;

    const patterns = [
        new RegExp(
            String.raw`(?:si\s+occupa|operano|opera|lavorano|lavora)\s+(?:di|in|su|nel|nello|nella|nei|negli|nelle|nell['’])\s*(.+?)${boundary}`,
            'i'
        ),
        new RegExp(
            String.raw`(?:relativi?|relative|riguardanti)\s+(?:a|ad|al|allo|alla|ai|agli|alle|all['’])\s*(.+?)${boundary}`,
            'i'
        ),
        new RegExp(
            String.raw`(?:nel\s+settore|nell['’]ambito|in\s+ambito)\s+(?:di\s+)?(.+?)${boundary}`,
            'i'
        )
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match?.[1]) continue;
        return match[1]
            .split(
                /\s+(?:e|ed|and|o|oppure|or)\s+(?:nel|nello|nella|nei|negli|nelle|nell['’])?|,|\//i
            )
            .map(normalizeTopic)
            .filter(Boolean);
    }
    return [];
}

function extractRequestedTarget(prompt) {
    const text = String(prompt || '');
    const patterns = [
        /mi\s+interessa\s+(?:il|la|un|una)?\s*(?:servizio|service|progetto|project|organizzazione|organization|dataset|entity|entita)?\s*(?:di|chiamato|denominato)?\s*["“']?([^"”'.!?]+)["”']?/i,
        /approfondisci\s+["“']([^"”']+)["”']/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match?.[1]) continue;
        const value = match[1].trim();
        if (!/^(xxx|\.\.\.xxx)$/i.test(value)) return value;
    }
    return '';
}

function resolveTargetTerm(prompt, mentions) {
    const normalized = normalizeText(prompt);

    const relationPatterns = [
        /(?:quali|quale|mostrami|elenca|trova)\s+(?:i|le|gli|l)?\s*([a-z0-9 ]+?)\s+(?:offrono|offre|collegat[oaie]?|associat[oaie]?|relazionat[oaie]?)/,
        /(?:e|con)\s+(?:i|le|gli|l)?\s*([a-z0-9]+)\s+(?:collegat[oaie]?|associat[oaie]?|relazionat[oaie]?)/,
        /(?:verso|a)\s+(?:i|le|gli|l)?\s*([a-z0-9]+)\s*(?:collegat[oaie]?|associat[oaie]?)?/
    ];

    for (const pattern of relationPatterns) {
        const match = normalized.match(pattern);

        if (match?.[1]) {
            return canonicalCatalogTerm(
                match[1].trim().split(' ').pop()
            );
        }
    }

    const sourceTerm = canonicalCatalogTerm(mentions[0]?.alias || '');

    const targetMention = mentions.find(mention => {
        const candidateTerm = canonicalCatalogTerm(mention.alias);

        return candidateTerm && candidateTerm !== sourceTerm;
    });

    return canonicalCatalogTerm(targetMention?.alias || '');
}

function parseMultiCatalogPrompt(prompt, publishedModels) {
    const descriptors = modelDescriptors(publishedModels);
    const mentions = findCatalogMentions(prompt, descriptors);
    const normalized = normalizeText(prompt);
    const asksRelations = /\b(collegat[oaie]?|associat[oaie]?|relazionat[oaie]?|relazione|relazioni|offrono|offre|quali servizi|quali progetti|quali organizzazioni)\b/.test(normalized);

    // Count distinct catalog families, not raw descriptor matches. More than one
    // published model can generate the same alias at the same prompt position.
    const mentionedCatalogFamilies = [
        ...new Set(
            mentions
                .map(mention => canonicalCatalogTerm(mention.alias))
                .filter(Boolean)
        )
    ];

    console.log('[MULTI CATALOG PARSER] Analysis', {
        prompt: String(prompt || ''),
        normalized,
        asksRelations,
        mentionsCount: mentions.length,
        mentionedCatalogFamilies,
        mentions: mentions.map(mention => ({
            title: mention.title,
            index: mention.index,
            alias: mention.alias,
            position: mention.position
        }))
    });

    if (!asksRelations || mentionedCatalogFamilies.length < 2) {
        const reason = !asksRelations
            ? 'relation_intent_not_detected'
            : 'catalog_families_not_resolved';

        console.log('[MULTI CATALOG PARSER] Not matched', {
            reason,
            asksRelations,
            mentionsCount: mentions.length,
            mentionedCatalogFamilies
        });

        return {
            matched: false,
            reason,
            mentionsCount: mentions.length,
            mentionedCatalogFamilies
        };
    }

    const sourceMention = mentions[0];
    const sourceIndexes = familyIndexes(sourceMention.alias, descriptors);
    const targetTerm = resolveTargetTerm(prompt, mentions);
    const targetIndexes = familyIndexes(targetTerm, descriptors)
        .filter(index => !sourceIndexes.includes(index));

    if (!sourceIndexes.length || !targetIndexes.length) {
        return {
            matched: false,
            reason: !sourceIndexes.length
                ? 'source_catalog_not_resolved'
                : 'target_catalog_not_resolved',
            sourceTerm: sourceMention.alias,
            targetTerm,
            mentionedCatalogFamilies
        };
    }

    return {
        matched: true,
        intent: 'multi_catalog_entity_search',
        source: {
            term: sourceMention.alias,
            indexes: sourceIndexes,
            topics: extractTopics(prompt),
            topicOperator: detectTopicOperator(prompt),
            limit: LIMITS.sourceEntities
        },
        relationTraversal: {
            enabled: true,
            targetTerm,
            targetIndexes,
            limitPerEntity: LIMITS.relationsPerEntity
        },
        requestedTarget: {
            query: extractRequestedTarget(prompt),
            detail: true
        },
        prompt: String(prompt || '').trim()
    };
}

async function callTool(context, tool, args) {
    context.toolCalls += 1;
    context.toolCounts[tool] = (context.toolCounts[tool] || 0) + 1;
      context.toolSequence.push(tool);

    if (context.toolCalls > LIMITS.maxToolCalls) {
        throw createError(`Superato il limite di ${LIMITS.maxToolCalls} chiamate MCP per richiesta`, 429);
    }

    const response = await mcpAgentToolService.callAgentTool({
        agentId: context.agentId,
        serverId: 'dymer',
        tool,
        arguments: args,
        dymeruser: context.dymeruser
    });
    return extractMcpResult(response);
}

function mergeEntities(groups) {
    const map = new Map();
    for (const group of groups) {
        for (const rawItem of Array.isArray(group?.items) ? group.items : []) {
            const item = compactEntity(rawItem);
            const key = `${item.index}|${item.id}`;
            if (item.id && !map.has(key)) map.set(key, item);
        }
    }
    return [...map.values()];
}

function matchesQuery(entity, query) {
    if (!query) return false;
    return normalizeText(`${entity.title} ${entity.description}`).includes(normalizeText(query));
}

function entityKey(entity) {
    return `${entity.index}|${entity.id}`;
}

function combineTopicResults(groups, operator) {
    if (!groups.length) return [];
    if (groups.length === 1 || operator !== 'AND') return mergeEntities(groups);

    const compactGroups = groups.map(group => mergeEntities([group]));
    const first = compactGroups[0];
    const otherSets = compactGroups.slice(1).map(group => new Set(group.map(entityKey)));

    return first.filter(entity =>
        otherSets.every(groupSet => groupSet.has(entityKey(entity)))
    );
}

function formatAnswer(
    plan,
    sourceEntities,
    targetsBySource,
    targetMatches,
    partialFailures,
    uniqueTargetDetail = null,
    targetMatchOrigin = '',
    topicFallback = null
) {
    if (!sourceEntities.length) {
        const criteria = plan.source.topics.length
            ? `${plan.source.topics.join(` ${plan.source.topicOperator} `)}`
            : 'i criteri richiesti';
        return `Nessuna entity trovata nei cataloghi ${plan.source.indexes.join(', ')} per ${criteria}.`;
    }

    const sections = [
        `Criteri applicati: ${plan.source.topics.length
            ? plan.source.topics.join(` ${plan.source.topicOperator} `)
            : 'nessun filtro tematico'}`,
        `Entity sorgente trovate: ${sourceEntities.length}`
    ];

    if (topicFallback) {
        sections.push(topicFallback);
    }

    sourceEntities.forEach((source, index) => {
        const targets = targetsBySource.get(`${source.index}|${source.id}`) || [];
        sections.push([
            `${index + 1}. ${source.title || source.id}`,
            `Catalogo: ${source.index}`,
            `ID: ${source.id}`,
            `Descrizione: ${compactDescription(source.description, 500) || 'Descrizione non disponibile'}`,
            targets.length
                ? `Entity collegate (${targets.length}):\n${targets.map((target, targetIndex) =>
                    `   ${targetIndex + 1}. ${target.title || target.id} [${target.index}] - ${target.id}`
                ).join('\n')}`
                : 'Entity collegate: nessuna corrispondenza nei cataloghi destinazione richiesti.'
        ].join('\n'));
    });

    if (plan.requestedTarget.query) {
        if (uniqueTargetDetail) {
            sections.push([
                `Dettaglio completo per "${plan.requestedTarget.query}":`,
                `Titolo: ${uniqueTargetDetail.title || uniqueTargetDetail.id}`,
                `Catalogo: ${uniqueTargetDetail.index || 'Non disponibile'}`,
                `ID: ${uniqueTargetDetail.id || 'Non disponibile'}`,
                targetMatchOrigin
                    ? `Origine corrispondenza: ${targetMatchOrigin}`
                    : '',
                `Descrizione: ${compactDescription(uniqueTargetDetail.description, 1200) || 'Descrizione non disponibile'}`,
                uniqueTargetDetail.status
                    ? `Stato: ${uniqueTargetDetail.status}`
                    : '',
                uniqueTargetDetail.updatedAt
                    ? `Data aggiornamento: ${uniqueTargetDetail.updatedAt}`
                    : ''
            ].filter(Boolean).join('\n'));
        } else {
            sections.push(targetMatches.length
                ? [
                    `Corrispondenze per "${plan.requestedTarget.query}":`,
                    ...targetMatches.map((target, index) => [
                        `${index + 1}. ${target.title || target.id}`,
                        `Catalogo: ${target.index}`,
                        `ID: ${target.id}`,
                        `Descrizione: ${compactDescription(target.description, 700) || 'Descrizione non disponibile'}`
                    ].join('\n'))
                ].join('\n\n')
                : `Nessuna entity collegata corrisponde a "${plan.requestedTarget.query}".`
            );
        }
    }

    if (partialFailures.length) {
        sections.push(`Avviso: ${partialFailures.length} consultazioni di relazioni non sono state completate. I risultati sono parziali.`);
    }

    return sections.join('\n\n');
}

async function runMultiCatalogOrchestration({ agentId, prompt, publishedModels, dymeruser }) {
    const plan = parseMultiCatalogPrompt(prompt, publishedModels);
    if (!plan.matched) {
        throw createError('Prompt multi-catalogo non risolto', 422, plan);
    }

    const context = {
        agentId,
        dymeruser,
        toolCalls: 0,
          toolSequence: [],
        toolCounts: {
            search_entities: 0,
            get_entity_relations: 0,
            get_entity: 0
        }
    };
    const sourceSearches = [];
    const sourceQueries = plan.source.topics.length ? plan.source.topics : [''];

    for (const query of sourceQueries) {
        sourceSearches.push(await callTool(context, 'search_entities', {
            indexes: plan.source.indexes,
            query,
            page: 1,
            limit: plan.source.limit
        }));
    }

    const combinedSources = combineTopicResults(
        sourceSearches,
        plan.source.topicOperator
    );
    const sourceEntities = combinedSources.slice(0, LIMITS.sourceEntities);
    const targetsBySource = new Map();
    const partialFailures = [];

    for (const source of sourceEntities) {
        try {
            const relations = await callTool(context, 'get_entity_relations', {
                index: source.index,
                entityId: source.id,
                relatedIndexes: plan.relationTraversal.targetIndexes,
                page: 1,
                limit: plan.relationTraversal.limitPerEntity
            });

            const targets = (Array.isArray(relations?.items) ? relations.items : [])
                .map(compactEntity)
                .filter(item => plan.relationTraversal.targetIndexes.includes(item.index))
                .slice(0, LIMITS.targetEntities);

            targetsBySource.set(`${source.index}|${source.id}`, targets);
        } catch (error) {
            partialFailures.push({ sourceId: source.id, message: error.message });
            targetsBySource.set(`${source.index}|${source.id}`, []);
        }
    }

    const allTargets = [...new Map(
        [...targetsBySource.values()].flat().map(target => [`${target.index}|${target.id}`, target])
    ).values()];

    let targetMatches = plan.requestedTarget.query
        ? allTargets.filter(target => matchesQuery(target, plan.requestedTarget.query))
        : [];
    let targetMatchOrigin = targetMatches.length
        ? 'relazioni delle entity sorgente'
        : '';

    if (plan.requestedTarget.query && targetMatches.length === 0) {
        const globalSearch = await callTool(context, 'search_entities', {
            indexes: plan.relationTraversal.targetIndexes,
            query: plan.requestedTarget.query,
            page: 1,
            limit: LIMITS.targetEntities
        });
        targetMatches = mergeEntities([globalSearch])
            .filter(target => matchesQuery(target, plan.requestedTarget.query));

        if (targetMatches.length) {
            targetMatchOrigin = 'ricerca globale nei cataloghi destinazione';
        }
    }

    let uniqueTargetDetail = null;
    if (plan.requestedTarget.detail && targetMatches.length === 1) {
        const target = targetMatches[0];
        const targetDetailResult = await callTool(context, 'get_entity', {
            index: target.index,
            id: target.id,
            includeRelations: false
        });

        const detailItems = Array.isArray(targetDetailResult?.items)
            ? targetDetailResult.items
            : Array.isArray(targetDetailResult)
                ? targetDetailResult
                : targetDetailResult && typeof targetDetailResult === 'object'
                    ? [targetDetailResult]
                    : [];

        if (detailItems.length) {
            uniqueTargetDetail = compactEntity(detailItems[0]);
        }
    }

    // Return only sources having at least one relation with a requested target catalog.
    const relatedSourceEntities = sourceEntities.filter(source => {
        const key = `${source.index}|${source.id}`;
        return (targetsBySource.get(key) || []).length > 0;
    });

    const answer = formatAnswer(
        plan,
        relatedSourceEntities,
        targetsBySource,
        targetMatches,
        partialFailures,
        uniqueTargetDetail,
        targetMatchOrigin,
        null
    );

    return {
        mode: 'multi-tool-deterministic',
        usedFallback: false,
        answer,
        message: { role: 'assistant', content: answer },
        executedTools: {
            searchEntities: context.toolCounts.search_entities,
            getEntityRelations: context.toolCounts.get_entity_relations,
            getEntity: context.toolCounts.get_entity,
            total: context.toolCalls,
              sequence: [...context.toolSequence],
            withinLimit: context.toolCalls <= LIMITS.maxToolCalls,
            maxAllowed: LIMITS.maxToolCalls
        },
        plan,
        data: {
            sourceEntities: relatedSourceEntities,
            traversedSourceEntities: sourceEntities,
            targetsBySource: Object.fromEntries(targetsBySource),
            targetMatches,
            targetMatchOrigin,
            uniqueTargetDetail,
            partialFailures
        }
    };
}

module.exports = {
    parseMultiCatalogPrompt,
    runMultiCatalogOrchestration
};
