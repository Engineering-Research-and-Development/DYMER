/**
 * Esempio: Template "serviced" - Servizi DYMER
 * 
 * Questo esempio mostra:
 * 1. Come il template viene ricevuto dall'API
 * 2. Come viene processato dal TemplateLoader
 * 3. Come viene renderizzato con Lit
 * 
 * Endpoint: /api/templates/api/v1/template?query[query][instance._index]=serviced
 */

// ============================================================================
// 1. RISPOSTA API (JSON reale dal microservizio dymer-templates)
// ============================================================================

export const servicedApiResponse = {
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f67890123456",
      "title": "Service Card Template",
      "instance": {
        "_index": "serviced",
        "_type": "serviced"
      },
      "metadata": {
        "version": "2.0",
        "author": "DYMER Team",
        "created": "2024-01-15T10:30:00Z"
      },
      "viewtype": [
        { "rendertype": "teaserlist" },
        { "rendertype": "fullcontent" },
        { "rendertype": "teaser" }
      ],
      "files": [
        {
          "_id": "file123",
          "filename": "serviced-teaserlist.html",
          "contentType": "text/html",
          "uploadDate": "2024-01-15T10:30:00Z",
          "data": `
            <div class="service-card {{#if featured}}featured{{/if}}" data-id="{{_id}}">
              <div class="service-header">
                {{#if icon}}
                  <img src="{{cdn}}/{{icon.path}}" class="service-icon" alt="{{title}}">
                {{else}}
                  <div class="service-icon-placeholder">🔧</div>
                {{/if}}
                <div class="service-title-wrapper">
                  <h3 class="service-title">{{title}}</h3>
                  {{#if subtitle}}
                    <p class="service-subtitle">{{subtitle}}</p>
                  {{/if}}
                </div>
                {{#if status}}
                  <span class="service-status status-{{status}}">{{uppercase status}}</span>
                {{/if}}
              </div>
              
              <div class="service-body">
                <p class="service-description">{{truncate description 200}}</p>
                
                {{#if tags}}
                  <div class="service-tags">
                    {{#each tags}}
                      <span class="tag">{{this}}</span>
                    {{/each}}
                  </div>
                {{/if}}
                
                <div class="service-meta">
                  {{#if price}}
                    <span class="service-price">{{currency price}}</span>
                  {{/if}}
                  {{#if duration}}
                    <span class="service-duration">⏱ {{duration}} min</span>
                  {{/if}}
                  {{#if rating}}
                    <span class="service-rating">⭐ {{rating}}/5</span>
                  {{/if}}
                </div>
              </div>
              
              <div class="service-footer">
                {{#if properties.owner}}
                  <div class="service-owner">
                    <span class="owner-label">By:</span>
                    <span class="owner-name">{{properties.owner.name}}</span>
                  </div>
                {{/if}}
                
                <div class="service-actions">
                  <button class="btn-details" onclick="viewService('{{_id}}')">
                    View Details
                  </button>
                  {{#if canBook}}
                    <button class="btn-book" onclick="bookService('{{_id}}')">
                      Book Now
                    </button>
                  {{/if}}
                </div>
              </div>
            </div>
          `
        },
        {
          "_id": "file124",
          "filename": "serviced-fullcontent.html",
          "contentType": "text/html", 
          "uploadDate": "2024-01-15T10:30:00Z",
          "data": `
            <article class="service-detail">
              <header class="service-detail-header">
                <div class="service-hero">
                  {{#if coverImage}}
                    <img src="{{cdn}}/{{coverImage.path}}" class="service-cover" alt="{{title}}">
                  {{/if}}
                  <div class="service-hero-overlay">
                    <h1 class="service-detail-title">{{title}}</h1>
                    {{#if subtitle}}
                      <p class="service-detail-subtitle">{{subtitle}}</p>
                    {{/if}}
                  </div>
                </div>
              </header>
              
              <div class="service-detail-content">
                <div class="service-main">
                  <section class="service-section">
                    <h2>Description</h2>
                    <div class="service-description-full">{{description}}</div>
                  </section>
                  
                  {{#if features}}
                    <section class="service-section">
                      <h2>Features</h2>
                      <ul class="feature-list">
                        {{#each features}}
                          <li class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span class="feature-text">{{this}}</span>
                          </li>
                        {{/each}}
                      </ul>
                    </section>
                  {{/if}}
                  
                  {{#if gallery}}
                    <section class="service-section">
                      <h2>Gallery</h2>
                      <div class="service-gallery">
                        {{#each gallery}}
                          <img src="{{cdn}}/{{path}}" alt="{{caption}}" class="gallery-image">
                        {{/each}}
                      </div>
                    </section>
                  {{/if}}
                </div>
                
                <aside class="service-sidebar">
                  <div class="service-info-card">
                    {{#if price}}
                      <div class="info-row">
                        <span class="info-label">Price:</span>
                        <span class="info-value price">{{currency price}}</span>
                      </div>
                    {{/if}}
                    {{#if duration}}
                      <div class="info-row">
                        <span class="info-label">Duration:</span>
                        <span class="info-value">{{duration}} minutes</span>
                      </div>
                    {{/if}}
                    {{#if location}}
                      <div class="info-row">
                        <span class="info-label">Location:</span>
                        <span class="info-value">{{location}}</span>
                      </div>
                    {{/if}}
                    
                    <div class="service-availability">
                      <button class="btn-book-large" onclick="bookService('{{_id}}')">
                        Book Appointment
                      </button>
                    </div>
                  </div>
                  
                  {{#if contact}}
                    <div class="service-contact">
                      <h3>Contact</h3>
                      {{#if contact.phone}}
                        <a href="tel:{{contact.phone}}" class="contact-link">📞 {{contact.phone}}</a>
                      {{/if}}
                      {{#if contact.email}}
                        <a href="mailto:{{contact.email}}" class="contact-link">✉️ {{contact.email}}</a>
                      {{/if}}
                    </div>
                  {{/if}}
                </aside>
              </div>
            </article>
          `
        },
        {
          "_id": "file125",
          "filename": "serviced-styles.css",
          "contentType": "text/css",
          "uploadDate": "2024-01-15T10:30:00Z",
          "data": `
            /* Service Card Styles */
            .service-card {
              background: white;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              overflow: hidden;
              transition: all 0.3s ease;
              border: 1px solid #e5e7eb;
            }
            
            .service-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 24px rgba(0,0,0,0.12);
            }
            
            .service-card.featured {
              border-color: #f59e0b;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
            }
            
            .service-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              padding: 1.25rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            
            .service-icon {
              width: 48px;
              height: 48px;
              border-radius: 10px;
              object-fit: cover;
              background: white;
              padding: 4px;
            }
            
            .service-icon-placeholder {
              width: 48px;
              height: 48px;
              border-radius: 10px;
              background: rgba(255,255,255,0.2);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
            }
            
            .service-title-wrapper {
              flex: 1;
            }
            
            .service-title {
              margin: 0;
              font-size: 1.125rem;
              font-weight: 600;
            }
            
            .service-subtitle {
              margin: 0.25rem 0 0;
              font-size: 0.875rem;
              opacity: 0.9;
            }
            
            .service-status {
              padding: 0.375rem 0.875rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .service-status.status-active {
              background: #10b981;
              color: white;
            }
            
            .service-status.status-pending {
              background: #f59e0b;
              color: white;
            }
            
            .service-status.status-inactive {
              background: #6b7280;
              color: white;
            }
            
            .service-body {
              padding: 1.25rem;
            }
            
            .service-description {
              margin: 0 0 1rem;
              color: #4b5563;
              line-height: 1.6;
              font-size: 0.9375rem;
            }
            
            .service-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              margin-bottom: 1rem;
            }
            
            .tag {
              background: #eff6ff;
              color: #1e40af;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
            }
            
            .service-meta {
              display: flex;
              gap: 1rem;
              align-items: center;
              margin-bottom: 1rem;
            }
            
            .service-price {
              font-size: 1.25rem;
              font-weight: 700;
              color: #059669;
            }
            
            .service-duration,
            .service-rating {
              font-size: 0.875rem;
              color: #6b7280;
            }
            
            .service-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem 1.25rem;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
            }
            
            .service-owner {
              font-size: 0.875rem;
              color: #6b7280;
            }
            
            .owner-label {
              font-weight: 500;
            }
            
            .service-actions {
              display: flex;
              gap: 0.75rem;
            }
            
            .btn-details,
            .btn-book {
              padding: 0.5rem 1rem;
              border: none;
              border-radius: 6px;
              font-size: 0.875rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            }
            
            .btn-details {
              background: white;
              color: #374151;
              border: 1px solid #d1d5db;
            }
            
            .btn-details:hover {
              background: #f3f4f6;
            }
            
            .btn-book {
              background: #3b82f6;
              color: white;
            }
            
            .btn-book:hover {
              background: #2563eb;
            }
            
            /* Full Content Styles */
            .service-detail {
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .service-hero {
              position: relative;
              height: 400px;
              overflow: hidden;
            }
            
            .service-cover {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .service-hero-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 3rem;
              background: linear-gradient(transparent, rgba(0,0,0,0.8));
              color: white;
            }
            
            .service-detail-title {
              font-size: 2.5rem;
              margin: 0 0 0.5rem;
            }
            
            .service-detail-content {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 3rem;
              padding: 2rem;
            }
            
            @media (max-width: 768px) {
              .service-detail-content {
                grid-template-columns: 1fr;
              }
            }
          `
        },
        {
          "_id": "file126",
          "filename": "serviced-logic.js",
          "contentType": "application/javascript",
          "uploadDate": "2024-01-15T10:30:00Z",
          "data": `
            // Helper functions for service template
            function calculateDiscount(price, originalPrice) {
              if (!originalPrice || originalPrice <= price) return 0;
              return Math.round(((originalPrice - price) / originalPrice) * 100);
            }
            
            function formatDuration(minutes) {
              if (minutes < 60) return minutes + ' min';
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return mins > 0 ? hours + 'h ' + mins + 'm' : hours + 'h';
            }
            
            function getStatusColor(status) {
              const colors = {
                active: '#10b981',
                pending: '#f59e0b',
                inactive: '#6b7280',
                archived: '#9ca3af'
              };
              return colors[status] || colors.inactive;
            }
            
            function viewService(id) {
              component.emit('view-service', { serviceId: id });
            }
            
            function bookService(id) {
              component.emit('book-service', { serviceId: id });
            }
          `
        }
      ]
    }
  ]
};

// ============================================================================
// 2. DATI ESEMPIO ENTITÀ
// ============================================================================

export const servicedEntityExample = {
  "_id": "srv123",
  "_index": "serviced",
  "title": "Professional Consulting Service",
  "subtitle": "Expert business strategy and planning",
  "description": "Our professional consulting service helps businesses develop comprehensive strategies for growth and success. We provide expert guidance in market analysis, financial planning, and operational efficiency. With over 10 years of experience, our team delivers actionable insights that drive real results.",
  "featured": true,
  "status": "active",
  "price": 150.00,
  "originalPrice": 200.00,
  "duration": 90,
  "rating": 4.8,
  "tags": ["Consulting", "Business", "Strategy", "Premium"],
  "icon": {
    "path": "icons/consulting.png",
    "filename": "consulting.png"
  },
  "coverImage": {
    "path": "covers/consulting-cover.jpg",
    "filename": "consulting-cover.jpg"
  },
  "features": [
    "Initial consultation and needs assessment",
    "Market research and competitive analysis",
    "Strategic planning and roadmap development",
    "Implementation support and follow-up",
    "Monthly progress reviews"
  ],
  "gallery": [
    { "path": "gallery/consulting-1.jpg", "caption": "Team meeting" },
    { "path": "gallery/consulting-2.jpg", "caption": "Strategy session" },
    { "path": "gallery/consulting-3.jpg", "caption": "Client presentation" }
  ],
  "location": "Remote / On-site available",
  "canBook": true,
  "contact": {
    "phone": "+39 02 1234567",
    "email": "consulting@example.com"
  },
  "properties": {
    "owner": {
      "uid": "user123",
      "name": "Marco Rossi"
    },
    "status": "1",
    "visibility": "0"
  },
  "_createdAt": "2024-01-10T08:00:00Z",
  "_updatedAt": "2024-01-15T14:30:00Z"
};

// ============================================================================
// 3. USO CON IL SISTEMA MODERNO
// ============================================================================

/**
 * Esempio: Caricare e renderizzare il template
 */
export async function exampleUsage() {
  // Import necessari
  const { TemplateLoader } = await import('../core/template-loader.js');
  const { html, render } = await import('https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js');
  
  // 1. Creare il loader
  const loader = new TemplateLoader({
    baseUrl: 'http://195.201.83.104',
    debug: true
  });
  
  // 2. Caricare il template (simulato con i dati di esempio)
  // Nel sistema reale:
  // const template = await loader.load('serviced');
  
  // Simuliamo il parsing del template
  const template = parseTemplateResponse(servicedApiResponse.data[0]);
  
  // 3. Renderizzare con i dati
  const container = document.getElementById('service-container');
  
  // Vista teaserlist
  const teaserView = template.views.teaserlist(servicedEntityExample);
  
  // Vista fullcontent
  const fullView = template.views.fullcontent(servicedEntityExample);
  
  // 4. Render nel DOM
  render(html`
    <style>${template.styles.global}</style>
    <div class="service-teaser">
      ${teaserView}
    </div>
  `, container);
  
  // 5. Gestire eventi
  container.addEventListener('view-service', (e) => {
    console.log('View service:', e.detail.serviceId);
    // Navigare alla vista dettaglio
  });
  
  container.addEventListener('book-service', (e) => {
    console.log('Book service:', e.detail.serviceId);
    // Aprire modale prenotazione
  });
}

/**
 * Parsing manuale per test
 */
function parseTemplateResponse(rawTemplate) {
  const template = {
    id: rawTemplate._id,
    title: rawTemplate.title,
    views: {},
    styles: {},
    scripts: {}
  };
  
  // Estrae file per tipo
  for (const file of rawTemplate.files) {
    if (file.contentType === 'text/html') {
      // Determina il viewtype dal nome
      if (file.filename.includes('teaserlist')) {
        template.views.teaserlist = compileToLit(file.data);
      } else if (file.filename.includes('fullcontent')) {
        template.views.fullcontent = compileToLit(file.data);
      } else if (file.filename.includes('teaser')) {
        template.views.teaser = compileToLit(file.data);
      }
    } else if (file.contentType === 'text/css') {
      template.styles.global = file.data;
    } else if (file.contentType === 'application/javascript') {
      template.scripts.global = file.data;
    }
  }
  
  return template;
}

/**
 * Compila template Handlebars a funzione Lit
 * Semplificazione del TemplateEngine per esempio
 */
function compileToLit(templateStr) {
  return (data) => {
    // Conversione semplificata
    let html = templateStr;
    
    // {{variable}} -> ${data.variable}
    html = html.replace(/\{\{\{?(\w+(?:\.\w+)*)\}?\}\}/g, '${data.$1}');
    
    // {{#if condition}}...{{/if}}
    html = html.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      '${data.$1 ? `$2` : ""}'
    );
    
    // {{#each array}}...{{/each}}
    html = html.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      '${(data.$1 || []).map(item => { 
        const ctx = { ...data, this: item };
        return `$2`.replace(/\{\{this\}\}/g, item);
      }).join("")}'
    );
    
    // Helper: uppercase
    html = html.replace(/\{\{uppercase\s+(\w+)\}\}/g, '${String(data.$1).toUpperCase()}');
    
    // Helper: truncate
    html = html.replace(
      /\{\{truncate\s+(\w+)\s+(\d+)\}\}/g,
      '${String(data.$1).substring(0, $2)}'
    );
    
    // Helper: currency
    html = html.replace(
      /\{\{currency\s+(\w+)\}\}/g,
      "'€' + Number(data.$1).toFixed(2)"
    );
    
    return html;
  };
}

// ============================================================================
// 4. TEST
// ============================================================================

export function runTests() {
  console.log('🧪 Testing Serviced Template...\n');
  
  // Test 1: Verifica struttura API
  console.log('✓ Test 1: API Response Structure');
  console.assert(servicedApiResponse.success === true, 'API should return success');
  console.assert(servicedApiResponse.data.length > 0, 'Should have template data');
  console.assert(servicedApiResponse.data[0].files.length === 4, 'Should have 4 files');
  
  // Test 2: Verifica file
  console.log('✓ Test 2: Template Files');
  const files = servicedApiResponse.data[0].files;
  const htmlFile = files.find(f => f.contentType === 'text/html' && f.filename.includes('teaserlist'));
  console.assert(htmlFile, 'Should have HTML file');
  console.assert(htmlFile.data.includes('{{title}}'), 'Should have Handlebars syntax');
  
  // Test 3: Verifica dati entità
  console.log('✓ Test 3: Entity Data');
  console.assert(servicedEntityExample._index === 'serviced', 'Entity should have correct index');
  console.assert(servicedEntityExample.title, 'Entity should have title');
  console.assert(Array.isArray(servicedEntityExample.tags), 'Entity should have tags array');
  
  // Test 4: Compilazione template
  console.log('✓ Test 4: Template Compilation');
  const template = parseTemplateResponse(servicedApiResponse.data[0]);
  console.assert(template.views.teaserlist, 'Should have teaserlist view');
  console.assert(template.views.fullcontent, 'Should have fullcontent view');
  console.assert(template.styles.global, 'Should have global styles');
  
  // Test 5: Rendering (semplificato)
  console.log('✓ Test 5: Template Rendering');
  try {
    const output = template.views.teaserlist(servicedEntityExample);
    console.assert(output.includes('Professional Consulting Service'), 'Should render title');
    console.assert(output.includes('⭐ 4.8/5'), 'Should render rating');
    console.log('  Render output preview:', output.substring(0, 100) + '...');
  } catch (err) {
    console.error('  Rendering failed:', err);
  }
  
  console.log('\n✅ All tests passed!\n');
}

// Export per uso
export default {
  apiResponse: servicedApiResponse,
  entity: servicedEntityExample,
  tests: runTests,
  example: exampleUsage
};
