# DYMER Modern - Documentazione Completa

## 📚 Indice

1. [Introduzione](#introduzione)
2. [Architettura](#architettura)
3. [Installazione](#installazione)
4. [Componenti](#componenti)
5. [API Reference](#api-reference)
6. [Migrazione dal Legacy](#migrazione-dal-legacy)
7. [Esempi Avanzati](#esempi-avanzati)
8. [Troubleshooting](#troubleshooting)

---

## Introduzione

DYMER Modern è il nuovo sistema di frontend basato su **Lit** e **Web Components** che sostituisce la libreria legacy `utility.js`. Offre:

- 🚀 **Performance**: Rendering reattivo e virtual scrolling
- 🎨 **Isolamento**: Shadow DOM previene conflitti CSS
- 🔧 **Manutenibilità**: Componenti modulari e testabili
- 📱 **Responsive**: Design mobile-first
- 🔒 **Sicurezza**: Template compilati, no eval()

### Confronto con Legacy

| Feature | Legacy (utility.js) | Modern |
|---------|---------------------|--------|
| Framework | jQuery + Handlebars | Lit (Web Components) |
| Bundle Size | ~300KB | ~15KB (Lit tree-shaken) |
| Rendering | Sincrono, DOM manip | Reattivo, efficient |
| CSS | Globale, conflitti | Shadow DOM isolato |
| Template | Stringhe HTML | Tagged templates |
| Cache | Nessuna | Multi-livello |

---

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                        PORTALE ESTERNO                      │
│                  (Liferay, WordPress, etc.)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    DYMER MODERN SYSTEM                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Core      │  │  Components  │  │     Mixins       │  │
│  │             │  │              │  │                  │  │
│  │ • Element   │  │ • EntityCard │  │ • EntityMixin    │  │
│  │ • Engine    │  │ • EntityList │  │ • AuthMixin      │  │
│  │ • Loader    │  │ • FormModal  │  │ • PaginationMixin│  │
│  └─────────────┘  │ • FilterPanel│  └──────────────────┘  │
│                   └──────────────┘                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              DYMER MICROSERVICES (REST API)               │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │dymer-webserver│ │dymer-entities│  │dymer-templates   │  │
│  │  (Gateway)  │  │   (CRUD)     │  │  (Templates)     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Flusso Dati

1. **Configurazione**: Il portale setta `window.kmsconfig` con URL endpoint
2. **Template Loading**: `TemplateLoader` fetcha da `/api/templates/api/v1/template`
3. **Compilazione**: `TemplateEngine` converte Handlebars → Lit
4. **Rendering**: Componenti Web renderizzano con Shadow DOM
5. **Interazione**: Eventi custom comunicano con il portale

---

## Installazione

### 1. Setup Base (ES Modules)

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Import come ES Module -->
  <script type="module">
    import { 
      DymerEntityCard,
      DymerEntityList, 
      DymerFormModal,
      initDymer 
    } from '/public/cdn/js/modern/modern-dymer.js';
  </script>
</head>
<body>
  <!-- Componenti disponibili -->
  <dymer-entity-list index="products"></dymer-entity-list>
</body>
</html>
```

### 2. Configurazione

```javascript
// Prima di usare i componenti
window.kmsconfig = {
  // URL base del dymer-webserver
  serverUrl: 'https://dymer.example.com',
  
  // URL CDN per assets
  cdn: 'https://dymer.example.com/public/cdn/',
  
  // Endpoints API
  endpoints: [
    { 
      type: 'entity', 
      endpoint: 'https://dymer.example.com/api/entities/api/v1/entity' 
    },
    { 
      type: 'template', 
      endpoint: 'https://dymer.example.com/api/templates/api/v1/template' 
    },
    { 
      type: 'form', 
      endpoint: 'https://dymer.example.com/api/forms/api/v1/form' 
    }
  ]
};

// Inizializza (opzionale, auto-inizializza)
import { initDymer } from '/public/cdn/js/modern/modern-dymer.js';
await initDymer(window.kmsconfig);
```

### 3. Polyfill per Browser Vecchi

```html
<!-- Per IE11 e vecchi browser -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>

<!-- Polyfill fetch/promises per IE -->
<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"></script>
```

---

## Componenti

### DymerEntityCard

Card singola per visualizzare un'entità.

#### Proprietà

| Proprietà | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `entity` | Object | null | Dati entità da visualizzare |
| `entity-id` | String | null | ID entità (auto-fetch se entity non fornito) |
| `template-id` | String | null | ID template da usare |
| `view-type` | String | 'teaser' | Tipo vista: 'teaser', 'teaserlist', 'fullcontent' |
| `editable` | Boolean | false | Mostra pulsanti edit/delete |
| `selectable` | Boolean | false | Abilita selezione al click |
| `selected` | Boolean | false | Stato selezionato |
| `compact` | Boolean | false | Layout compatto |

#### Eventi

| Evento | Detail | Descrizione |
|--------|--------|-------------|
| `dymer-select` | `{ entity, selected }` | Entity selelezionata/deselezionata |
| `dymer-edit` | `{ entity }` | Richiesta modifica |
| `dymer-delete` | `{ entityId, entity }` | Richiesta cancellazione |
| `dymer-entity-loaded` | `{ entity }` | Entity caricata da API |
| `dymer-template-loaded` | `{ template }` | Template caricato |

#### Esempio

```html
<!-- Vista teaser semplice -->
<dymer-entity-card
  entity-id="srv123"
  template-id="serviced"
  view-type="teaser">
</dymer-entity-card>

<!-- Con azioni -->
<dymer-entity-card
  .entity="${productData}"
  template-id="products"
  view-type="fullcontent"
  editable
  selectable
  @dymer-select="${handleSelect}"
  @dymer-edit="${handleEdit}"
  @dymer-delete="${handleDelete}">
</dymer-entity-card>
```

```javascript
// JavaScript
const card = document.querySelector('dymer-entity-card');

// Imposta dati programmaticamente
card.entity = {
  _id: 'prod123',
  title: 'My Product',
  price: 99.99,
  // ...
};

// Listen events
card.addEventListener('dymer-select', (e) => {
  console.log('Selected:', e.detail.entity.title);
  console.log('Is selected:', e.detail.selected);
});
```

---

### DymerEntityList

Lista/grid di entità con paginazione e virtual scrolling.

#### Proprietà

| Proprietà | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `index` | String | required | Tipo entità (es. 'products', 'serviced') |
| `view-type` | String | 'teaser' | Layout: 'teaser', 'teaserlist', 'datatable' |
| `query` | Object | {} | Query Elasticsearch |
| `page-size` | Number | 20 | Elementi per pagina |
| `current-page` | Number | 1 | Pagina corrente |
| `infinite-scroll` | Boolean | false | Scroll infinito vs paginazione |
| `paginated` | Boolean | true | Mostra controlli paginazione |
| `sort-field` | String | '_updatedAt' | Campo ordinamento |
| `sort-direction` | String | 'desc' | 'asc' o 'desc' |
| `selection-mode` | String | 'none' | 'none', 'single', 'multiple' |

#### Eventi

| Evento | Detail | Descrizione |
|--------|--------|-------------|
| `dymer-data-loaded` | `{ items, total }` | Dati caricati |
| `dymer-select` | `{ entity, selected }` | Elemento selezionato |
| `dymer-edit` | `{ entity }` | Richiesta modifica |
| `dymer-delete` | `{ entityId }` | Richiesta cancellazione |
| `dymer-page-change` | `{ page }` | Cambio pagina |

#### Metodi

```javascript
const list = document.querySelector('dymer-entity-list');

// Ricarica dati
await list.loadData();

// Cambia pagina
list.goToPage(3);

// Cambia ordinamento
list.sortField = 'price';
list.sortDirection = 'asc';
list.loadData();

// Selezione multipla (se selection-mode="multiple")
// Accesso via list.selectedIds
```

#### Esempio

```html
<!-- Lista base -->
<dymer-entity-list
  index="products"
  view-type="teaser"
  page-size="12">
</dymer-entity-list>

<!-- Con query filtrata -->
<dymer-entity-list
  index="serviced"
  view-type="teaserlist"
  .query="${{ bool: { must: [{ term: { status: 'active' } }] } }}"
  @dymer-data-loaded="${onDataLoaded}">
</dymer-entity-list>

<!-- Scroll infinito -->
<dymer-entity-list
  index="articles"
  view-type="teaser"
  infinite-scroll
  page-size="20">
</dymer-entity-list>
```

---

### DymerFormModal

Modale per creazione/modifica entità.

#### Metodi

```javascript
const modal = document.querySelector('dymer-form-modal');

// Apri in modalità creazione
await modal.openModal({
  mode: 'create',
  formIndex: 'products'
});

// Apri in modalità modifica
await modal.openModal({
  mode: 'edit',
  formIndex: 'products',
  entityId: 'prod123'
});

// Chiudi
modal.close();
```

#### Eventi

| Evento | Detail | Descrizione |
|--------|--------|-------------|
| `dymer-submit` | `{ mode, data, entityId? }` | Form inviato |
| `dymer-saved` | `{ entity }` | Salvataggio riuscito |
| `dymer-error` | `{ error }` | Errore |
| `dymer-closed` | - | Modale chiusa |

#### Esempio

```html
<dymer-form-modal id="product-modal"></dymer-form-modal>

<button onclick="openCreate()">Nuovo Prodotto</button>
<button onclick="openEdit()">Modifica</button>
```

```javascript
async function openCreate() {
  const modal = document.getElementById('product-modal');
  
  await modal.openModal({
    mode: 'create',
    formIndex: 'products'
  });
  
  modal.addEventListener('dymer-submit', async (e) => {
    console.log('Creating:', e.detail.data);
    
    // Chiamata API personalizzata
    const response = await fetch('/api/entities', {
      method: 'POST',
      body: JSON.stringify(e.detail.data)
    });
    
    if (response.ok) {
      modal.close();
      // Ricarica lista
      document.querySelector('dymer-entity-list').loadData();
    }
  });
}
```

---

### DymerFilterPanel

Pannello filtri avanzato.

#### Proprietà

| Proprietà | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `index` | String | required | Tipo entità |
| `expanded` | Boolean | false | Espandi per default |
| `layout` | String | 'vertical' | 'horizontal', 'vertical', 'collapsed' |
| `show-tags` | Boolean | true | Mostra tag filtri attivi |

#### Eventi

| Evento | Detail | Descrizione |
|--------|--------|-------------|
| `dymer-filter-change` | `{ filters, query, filterCount }` | Filtri cambiati |
| `dymer-apply-filters` | - | Pulsante applica premuto |

#### Esempio

```html
<dymer-filter-panel
  index="products"
  expanded
  @dymer-filter-change="${handleFilterChange}">
</dymer-filter-panel>
```

```javascript
function handleFilterChange(e) {
  const { filters, query } = e.detail;
  
  // Applica query a EntityList
  const list = document.querySelector('dymer-entity-list');
  list.query = query;
  list.loadData();
}
```

---

## API Reference

### TemplateLoader

```javascript
import { TemplateLoader, getTemplateLoader } from './core/template-loader.js';

// Singleton (consigliato)
const loader = getTemplateLoader({
  baseUrl: 'https://dymer.example.com',
  cacheEnabled: true,
  cacheDuration: 5 * 60 * 1000, // 5 min
  debug: false
});

// Carica template
const template = await loader.load('serviced');

// Preload multipli
const templates = await loader.preload(['serviced', 'products', 'articles']);

// Statistiche cache
console.log(loader.getStats());

// Pulisci cache
loader.clearCache();
```

### TemplateEngine

```javascript
import { TemplateEngine } from './core/template-engine.js';

const engine = new TemplateEngine();

// Compila template
const templateFn = engine.compile(`
  <div class="card">
    <h3>{{title}}</h3>
    <p>{{truncate description 100}}</p>
    {{#if price}}
      <span>{{currency price}}</span>
    {{/if}}
  </div>
`);

// Renderizza
const html = templateFn({
  title: 'Prodotto',
  description: 'Descrizione lunga...',
  price: 99.99
});

// Helper personalizzati
engine.addHelper('myHelper', (value) => value.toUpperCase());
```

### ApiClient

```javascript
import { ApiClient, getApiClient } from './utils/api-client.js';

const client = getApiClient({
  baseUrl: 'https://dymer.example.com/api',
  timeout: 30000,
  retries: 3
});

// GET
const response = await client.get('/v1/entity/123');

// POST
const created = await client.post('/v1/entity', {
  title: 'Nuovo',
  data: { ... }
});

// Con FormData (upload file)
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('data', JSON.stringify({ title: 'X' }));

await client.post('/v1/entity', formData);
```

### Mixins

```javascript
import { DymerElement } from './core/dymer-element.js';
import { EntityMixin } from './mixins/entity-mixin.js';
import { AuthMixin } from './mixins/auth-mixin.js';
import { PaginationMixin } from './mixins/pagination-mixin.js';

class MyComponent extends 
  PaginationMixin(
    AuthMixin(
      EntityMixin(DymerElement)
    )
  ) {
  
  // Ora ha accesso a:
  // - this.callApi()
  // - this.getEntity(), this.createEntity(), etc.
  // - this.hasRole(), this.canEdit(), etc.
  // - this.currentPage, this.goToPage(), etc.
}
```

---

## Migrazione dal Legacy

### Mappa API

| Legacy | Modern |
|--------|--------|
| `kmsrenderEl(ar, viewType)` | `<dymer-entity-list view-type="${viewType}">` |
| `loadModelListToModal(target, index, action)` | `modal.openModal({ mode: 'create', formIndex: index })` |
| `actionPostMultipartForm(type, el, ...)` | `entityList.loadData()` con query |
| `checkPermission(item, act)` | `authMixin.canEdit(item)` |
| `hookReleationForm(item)` | Componente `<dymer-relation-picker>` |
| `populateFormEdit(frm, item)` | Automatico in `DymerFormModal` |

### Adapter Pattern

```javascript
// Creare adapter per codice legacy
window.utilityAdapter = {
  kmsrenderEl: async (entities, viewType) => {
    const container = document.querySelector(kmsconf.target[viewType]?.id);
    if (!container) return;
    
    // Usa componente moderno
    container.innerHTML = `
      <dymer-entity-list
        view-type="${viewType}"
        .items="${entities}"
        paginated="false">
      </dymer-entity-list>
    `;
  },

  loadModelListToModal: async (target, index, action) => {
    const modal = document.createElement('dymer-form-modal');
    document.body.appendChild(modal);
    
    await modal.openModal({
      mode: action === 'create' ? 'create' : 'edit',
      formIndex: index
    });
    
    return modal;
  }
};
```

### Gradual Migration

1. **Fase 1**: Usa adapter per mantenere API legacy
2. **Fase 2**: Sostituisci gradualmente i componenti
3. **Fase 3**: Rimuovi adapter quando tutto è migrato

---

## Esempi Avanzati

### E-commerce con Carrello

```html
<dymer-entity-list
  index="products"
  view-type="teaser"
  @dymer-select="${addToCart}">
</dymer-entity-list>

<div id="cart">
  <h3>Carrello (${cartCount})</h3>
  <ul id="cart-items"></ul>
</div>
```

```javascript
let cart = [];

function addToCart(e) {
  const product = e.detail.entity;
  cart.push(product);
  updateCartUI();
}

async function checkout() {
  const modal = document.createElement('dymer-form-modal');
  await modal.openModal({
    mode: 'create',
    formIndex: 'orders'
  });
  
  // Pre-popola con dati carrello
  modal.formData = {
    items: cart.map(p => ({ productId: p._id, quantity: 1 })),
    total: cart.reduce((sum, p) => sum + p.price, 0)
  };
}
```

### Dashboard Admin

```html
<div class="admin-dashboard">
  <dymer-filter-panel
    index="serviced"
    layout="horizontal"
    expanded
    @dymer-filter-change="${updateDashboard}">
  </dymer-filter-panel>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h4>Totale Servizi</h4>
      <span class="stat-value" id="total-count">-</span>
    </div>
    <div class="stat-card">
      <h4>Attivi</h4>
      <span class="stat-value" id="active-count">-</span>
    </div>
  </div>
  
  <dymer-entity-list
    index="serviced"
    view-type="teaserlist"
    selection-mode="multiple"
    @dymer-selection-change="${updateSelection}">
  </dymer-entity-list>
  
  <div class="bulk-actions" id="bulk-actions" style="display: none;">
    <button onclick="bulkDelete()">Cancella Selezionati</button>
    <button onclick="bulkExport()">Esporta CSV</button>
  </div>
</div>
```

### Ricerca con Autocomplete

```javascript
const searchInput = document.getElementById('search');

searchInput.addEventListener('input', debounce(async (e) => {
  const query = {
    query: {
      query_string: {
        query: `*${e.target.value}*`,
        fields: ['title', 'description', 'tags']
      }
    }
  };
  
  const list = document.querySelector('dymer-entity-list');
  list.query = query;
  await list.loadData();
}, 300));

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

---

## Troubleshooting

### Problemi Comuni

#### 1. Componenti non renderizzano

**Sintomo**: Schermo vuoto, nessun errore

**Soluzione**:
```javascript
// Verifica configurazione
console.log('kmsconfig:', window.kmsconfig);

// Verifica custom elements
customElements.whenDefined('dymer-entity-list')
  .then(() => console.log('✅ Componente registrato'))
  .catch(err => console.error('❌ Errore:', err));
```

#### 2. CORS Errors

**Sintomo**: `Access-Control-Allow-Origin` error

**Soluzione**:
```javascript
// Nel dymer-webserver, aggiungi header CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});
```

#### 3. Template non trovato

**Sintomo**: `Template X not found`

**Soluzione**:
```javascript
// Verifica che il template esista
const response = await fetch('/api/templates/api/v1/template?query={"instance._index":"X"}');
const data = await response.json();
console.log('Templates:', data.data.map(t => t.instance._index));
```

#### 4. Performance lente

**Ottimizzazioni**:
```javascript
// 1. Abilita caching
const loader = getTemplateLoader({
  cacheEnabled: true,
  cacheDuration: 10 * 60 * 1000 // 10 min
});

// 2. Usa infinite scroll invece di paginazione
<dymer-entity-list infinite-scroll page-size="20">

// 3. Virtual scrolling per liste grandi
<dymer-entity-list virtual-scroll item-height="200">
```

#### 5. Memory Leaks

**Prevenzione**:
```javascript
class MyComponent extends DymerElement {
  disconnectedCallback() {
    super.disconnectedCallback();
    // Pulisci event listeners
    this._observer?.disconnect();
    this._interval && clearInterval(this._interval);
  }
}
```

### Debug Mode

```javascript
// Abilita logging dettagliato
window.kmsconfig = {
  ...window.kmsconfig,
  debug: true
};

// O nel componente
<dymer-entity-list debug-mode>
```

### Browser Support

| Browser | Versione Minima |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13.1+ |
| Edge | 80+ |
| IE11 | ⚠️ Richiede polyfill completo |

---

## Roadmap

- [ ] Supporto TypeScript definitions
- [ ] Componente Calendar/Booking
- [ ] Integrazione WebSocket per real-time
- [ ] Offline mode con Service Worker
- [ ] Theme system (light/dark/custom)
- [ ] React/Vue wrappers

---

## Supporto

- 📧 Email: support@dymer.io
- 💬 Slack: #dymer-modern
- 🐛 Issues: https://github.com/dymer/dymer/issues
- 📖 Wiki: https://docs.dymer.io/modern

---

**Versione**: 2.0.0  
**Ultimo aggiornamento**: 2024-01-15  
**Licenza**: MIT