const axios = require('axios');

const PLAN_KINDS = new Set(['general_chat', 'tool_call', 'workflow']);
const RESPONSE_GOALS = new Set(['list', 'detail', 'count', 'schema', 'relations', 'analysis']);

function extractJson(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) {}
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) { try { return JSON.parse(fenced[1].trim()); } catch (_) {} }
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
    return null;
}

function normalizeTools(tools) {
    return (Array.isArray(tools) ? tools : [])
        .map(tool => {
            const schema = tool?.inputSchema && typeof tool.inputSchema === 'object'
                ? tool.inputSchema
                : {};
            const properties = schema.properties && typeof schema.properties === 'object'
                ? schema.properties
                : {};
            const required = new Set(Array.isArray(schema.required) ? schema.required : []);
            const parameters = {};
            for (const [name, definition] of Object.entries(properties)) {
                parameters[name] = {
                    type: definition?.type || (definition?.items ? 'array' : 'unknown'),
                    itemType: definition?.items?.type || undefined,
                    required: required.has(name)
                };
                if (definition?.default !== undefined) parameters[name].default = definition.default;
            }
            return {
                name: String(tool?.name || '').trim(),
                description: String(tool?.description || '').trim(),
                parameters
            };
        })
        .filter(tool => tool.name);
}
function normalizeWorkflows(workflows) {
    return (Array.isArray(workflows) ? workflows : []).map(workflow => ({
        name: String(workflow?.name || '').trim(),
        description: String(workflow?.description || '').trim()
    })).filter(workflow => workflow.name);
}

function normalizePlan(raw, originalPrompt, tools = [], workflows = []) {
    if (!raw || typeof raw !== 'object') return null;
    const kind = String(raw.kind || '').trim();
    if (!PLAN_KINDS.has(kind)) return null;
    const toolNames = new Set(normalizeTools(tools).map(item => item.name));
    const workflowNames = new Set(normalizeWorkflows(workflows).map(item => item.name));
    const rawTool = typeof raw.tool === 'string' ? raw.tool : raw.tool?.name;
    const rawWorkflow = typeof raw.workflow === 'string' ? raw.workflow : raw.workflow?.name;
    const genericName = typeof raw.name === 'string' ? raw.name : raw.name?.name;
    const tool = String(rawTool || (kind === 'tool_call' ? genericName : '') || '').trim() || null;
    const workflow = String(rawWorkflow || (kind === 'workflow' ? genericName : '') || '').trim() || null;
    if (kind === 'tool_call' && (!tool || !toolNames.has(tool))) return null;
    if (kind === 'workflow' && (!workflow || !workflowNames.has(workflow))) return null;

    const argumentsObject = raw.arguments && typeof raw.arguments === 'object' && !Array.isArray(raw.arguments)
        ? { ...raw.arguments }
        : {};
    const nestedScope = argumentsObject.scope && typeof argumentsObject.scope === 'object' && !Array.isArray(argumentsObject.scope)
        ? argumentsObject.scope
        : null;
    delete argumentsObject.scope;
    const scope = raw.scope && typeof raw.scope === 'object' && !Array.isArray(raw.scope)
        ? raw.scope
        : (nestedScope || {});

    const confidenceValue = Number(raw.confidence);
    return {
        kind,
        tool: kind === 'tool_call' ? tool : null,
        workflow: kind === 'workflow' ? workflow : null,
        arguments: argumentsObject,
        scope,
        responseGoal: RESPONSE_GOALS.has(String(raw.responseGoal || '')) ? String(raw.responseGoal) : 'list',
        confidence: Number.isFinite(confidenceValue) ? Math.max(0, Math.min(1, confidenceValue)) : 0,
        reason: String(raw.reason || '').trim(),
        originalPrompt: String(originalPrompt || '').trim()
    };
}

function applyDeterministicPlanRules(plan, originalPrompt) {
    if (!plan) return null;

    const normalizedPrompt = String(originalPrompt || '')
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const asksForCount =
        /\bquante?\b/.test(normalizedPrompt) ||
        /\bquanti\b/.test(normalizedPrompt) ||
        /\bnumero\b/.test(normalizedPrompt) ||
        /\bconteggio\b/.test(normalizedPrompt) ||
        /\bconta(?:re)?\b/.test(normalizedPrompt) ||
        /\btotal[ei]\b/.test(normalizedPrompt);

    const hasSpecificCatalog =
        Boolean(plan.arguments?.index) ||
        (Array.isArray(plan.arguments?.indexes) && plan.arguments.indexes.length > 0);

    if (plan.kind === 'tool_call' && plan.tool === 'search_entities' && asksForCount) {
        plan.responseGoal = 'count';
        if (!hasSpecificCatalog) {
            plan.scope = { ...plan.scope, type: 'all_published_indexes' };
        }
        plan.arguments = {
            ...plan.arguments,
            query: typeof plan.arguments?.query === 'string' ? plan.arguments.query : '',
            page: 1,
            limit: 1
        };
    }

    return plan;
}

function buildPlannerPrompt(prompt, tools, workflows) {
    const toolNames = normalizeTools(tools).map(item => item.name);
    const workflowNames = normalizeWorkflows(workflows).map(item => item.name);
    return [
        'Sei il router MCP DYMER.',
        'Rispondi solo con JSON valido, senza Markdown o spiegazioni.',
        'Scegli un tool, un workflow o general_chat. Non inventare nomi.',
        `Tool: ${JSON.stringify(toolNames)}`,
        `Workflow: ${JSON.stringify(workflowNames)}`,
        'Per elementi collegati usa responseGoal=relations.',
        'Output: {"kind":"tool_call|workflow|general_chat","name":"nome|null","arguments":{},"responseGoal":"list|detail|count|schema|relations|analysis"}',
        `Richiesta: ${String(prompt || '').trim()}`
    ].join('\n');
}
async function planPrompt({ agent, prompt, tools = [], workflows = [], timeoutMs = 60000 }) {
    const normalizedPrompt = String(prompt || '')
        .toLocaleLowerCase('it')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const availableToolNames = new Set(normalizeTools(tools).map(item => item.name));

    // Classify the object of the count before choosing a tool. In particular,
    // "quante relazioni hanno le entita di indice SERVICE" must never fall
    // through to count_entities or to the single-entity relations resolver.
    const asksForCount =
        /\b(quanti|quante|quanto|quanta|numero|conteggio|conta|contare|totale|totali)\b/i
            .test(normalizedPrompt);
    const mentionsRelations =
        /\b(relazione|relazioni|relation|relations)\b/i.test(normalizedPrompt);
    const mentionsEntities =
        /\b(entity|entities|entita)\b/i.test(normalizedPrompt);
    const mentionsModels =
        /\b(model|models|modello|modelli|catalogo|cataloghi)\b/i.test(normalizedPrompt);

    const asksForRelationCount = asksForCount && mentionsRelations;
    const asksForEntityCount =
        asksForCount && mentionsEntities && !mentionsModels && !mentionsRelations;
    const asksForModelCount =
        asksForCount && mentionsModels && !mentionsEntities && !mentionsRelations;

    console.log('[MCP PLANNER] Count classification', {
        normalizedPrompt,
        availableTools: [...availableToolNames],
        asksForCount,
        mentionsRelations,
        mentionsEntities,
        mentionsModels,
        asksForRelationCount,
        asksForEntityCount,
        asksForModelCount
    });

    if (asksForRelationCount && availableToolNames.has('count_relations')) {
        const indexMatch = normalizedPrompt.match(/\bindice\s+(?:di\s+)?([a-z0-9._-]+)/i);
        const index = indexMatch?.[1] ? indexMatch[1].trim() : null;
        const plan = {
            kind: 'tool_call',
            tool: 'count_relations',
            workflow: null,
            arguments: index ? { index } : {},
            scope: index ? { type: 'catalog_relations', index } : { type: 'relations' },
            responseGoal: 'count',
            confidence: index ? 1 : 0.9,
            reason: 'deterministic_count_relations_fast_path',
            originalPrompt: String(prompt || '').trim()
        };
        console.log('[MCP PLANNER] Deterministic relation count fast path', plan);
        return { used: true, reason: null, plan, fastPath: true };
    }

    if (asksForModelCount && availableToolNames.has('list_models')) {
        const plan = {
            kind: 'tool_call',
            tool: 'list_models',
            workflow: null,
            arguments: {},
            scope: { type: 'published_models' },
            responseGoal: 'count',
            confidence: 1,
            reason: 'deterministic_count_models_fast_path',
            originalPrompt: String(prompt || '').trim()
        };
        console.log('[MCP PLANNER] Deterministic model count fast path', plan);
        return { used: true, reason: null, plan, fastPath: true };
    }

    // Fast deterministic route only when the counted object is explicitly entity/entities.
    if (asksForEntityCount && availableToolNames.has('count_entities')) {
        const plan = {
            kind: 'tool_call',
            tool: 'count_entities',
            workflow: null,
            arguments: {},
            scope: { type: 'all_visible_entities' },
            responseGoal: 'count',
            confidence: 1,
            reason: 'deterministic_count_entities_fast_path',
            originalPrompt: String(prompt || '').trim()
        };
        console.log('[MCP PLANNER] Deterministic fast path', plan);
        return { used: true, reason: null, plan, fastPath: true };
    }

    if (!agent || agent.provider !== 'ollama') return { used: false, reason: 'provider_not_supported', plan: null };
    const baseUrl = String(agent.settings?.baseUrl || agent.baseUrl || '').trim().replace(/\/+$/, '').replace('://0.0.0.0:', '://127.0.0.1:').replace('://localhost:', '://127.0.0.1:');
    if (!baseUrl || !agent.model) return { used: false, reason: 'ollama_not_configured', plan: null };
    const plannerStartedAt = Date.now();
    const plannerPrompt = buildPlannerPrompt(prompt, tools, workflows);
    console.log('[MCP PLANNER] Ollama request', {
        endpoint: `${baseUrl}/api/generate`,
        model: agent.model,
        timeoutMs,
        toolsCount: Array.isArray(tools) ? tools.length : 0,
        workflowsCount: Array.isArray(workflows) ? workflows.length : 0,
        promptLength: plannerPrompt.length
    });
    try {
        const ollamaPayload = {
            model: agent.model,
            prompt: plannerPrompt,
            stream: false,
            keep_alive: '10m',
            options: { temperature: 0, num_predict: 64 }
        };
        console.log('[MCP PLANNER] Ollama payload', JSON.stringify(ollamaPayload, null, 2));
        const response = await axios.post(
            `${baseUrl}/api/generate`,
            ollamaPayload,
            { timeout: timeoutMs, proxy: false, headers: { 'Content-Type': 'application/json' } }
        );
        console.log('[MCP PLANNER] Ollama completed', {
            durationMs: Date.now() - plannerStartedAt,
            responseLength: String(response?.data?.response || '').length
        });
        console.log(
            '[MCP PLANNER] Raw Ollama plan',
            response?.data?.response
        );
        const raw = extractJson(response?.data?.response);
        console.log('[MCP PLANNER] Extracted plan', raw ? JSON.stringify(raw, null, 2) : null);
        const normalizedPlan = normalizePlan(raw, prompt, tools, workflows);
        const plan = applyDeterministicPlanRules(normalizedPlan, prompt);
        console.log('[MCP PLANNER] Normalized plan', {
            kind: plan?.kind || null,
            tool: plan?.tool || null,
            workflow: plan?.workflow || null,
            responseGoal: plan?.responseGoal || null,
            scope: plan?.scope || null,
            arguments: plan?.arguments || null
        });
        if (!plan) return { used: true, reason: 'invalid_plan', plan: null, raw };
        return { used: true, reason: null, plan };
    } catch (error) {
        console.error('[MCP PLANNER] Ollama error', {
            durationMs: Date.now() - plannerStartedAt,
            message: error.message,
            code: error.code || null,
            status: error.response?.status || null,
            response: error.response?.data || null
        });
        return {
            used: true,
            reason: 'planner_unavailable',
            plan: null,
            error: error.message,
            code: error.code || null,
            status: error.response?.status || null
        };
    }
}

module.exports = { planPrompt, normalizePlan, extractJson, applyDeterministicPlanRules, PLAN_KINDS };
