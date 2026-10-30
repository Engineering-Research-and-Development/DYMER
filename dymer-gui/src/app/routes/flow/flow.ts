import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { XyFlowComponent } from './xyflow/xy-flow.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-flow',
  imports: [XyFlowComponent],
  templateUrl: './flow.html',
  styleUrl: './flow.scss',
})
export class FlowComponent {
  flowComponent = viewChild.required(XyFlowComponent);
  activeTab = signal<'library' | 'templates'>('library');
  savedTemplates = signal<any[]>([]);

  presetGroups = [
    {
      group: 'Triggers & Listeners',
      items: [
        { label: 'Webhook Receiver', action: 'Listen POST/GET', dataSource: 'HTTP Payload', output: 'Raw JSON', color: '#8b5cf6', provider: 'API Gateway' },
        { label: 'Cron Scheduler', action: 'Emit event', dataSource: 'System Clock', output: 'Timestamp', color: '#3b82f6', provider: 'Cron System' },
        { label: 'Kafka Consumer', action: 'Subscribe Topic', dataSource: 'Kafka Topic', output: 'Message JSON', color: '#000000', provider: 'Apache Kafka' },
        { label: 'RabbitMQ', action: 'Consume Queue', dataSource: 'AMQP Broker', output: 'Queue Payload', color: '#ff6600', provider: 'RabbitMQ' },
        { label: 'WebSocket In', action: 'On Message', dataSource: 'WSS Stream', output: 'Event Data', color: '#14b8a6', provider: 'Socket.io' }
      ]
    },
    {
      group: 'Processing & Flow',
      items: [
        { label: 'Router / Switch', action: 'Evaluate Logic / Roles', dataSource: 'Input Payload', output: 'Routed Branches', color: '#64748b', jsonIndex: 'data.role == "admin"' },
        { label: 'JSON Extractor', action: 'Extract Path', dataSource: 'Raw JSON', output: 'JSON Object', color: '#10b981', jsonIndex: 'data.payload.items' },
        { label: 'Data Transform', action: 'Map() / Filter()', dataSource: 'Incoming JSON', output: 'Mapped List', color: '#06b6d4' },
        { label: 'Custom JS Snippet', action: 'Execute Function', dataSource: 'Input Node', output: 'Dynamic', color: '#eab308', provider: 'Node.js V8' }
      ]
    },
    {
      group: 'AI & Inference',
      items: [
        { label: 'AI Agent (LLM)', action: 'Analyze Process', dataSource: 'Raw Input Data', output: 'Structured JSON', color: '#c026d3', provider: 'OpenAI / Gemini' },
        { label: 'Local LLM Inference', action: 'Generate Text', dataSource: 'Prompt Template', output: 'String / JSON', color: '#ec4899', provider: 'Ollama / Llama.cpp' },
        { label: 'Audio Transcriber', action: 'Speech-to-Text', dataSource: 'Audio Stream', output: 'Text Transcript', color: '#9333ea', provider: 'Whisper API' }
      ]
    },
    {
      group: 'Databases & Vector',
      items: [
        { label: 'Qdrant Vector DB', action: 'Embed & Upsert', dataSource: 'Text Entity', output: 'Vector Point ID', color: '#e11d48', provider: 'Qdrant' },
        { label: 'PostgreSQL', action: 'Execute SQL Query', dataSource: 'SQL String', output: 'Recordset Array', color: '#336791', provider: 'PostgreSQL' },
        { label: 'MongoDB', action: 'Find / Aggregate', dataSource: 'NoSQL Pipeline', output: 'BSON / JSON List', color: '#4db33d', provider: 'MongoDB' },
        { label: 'Redis KV Store', action: 'GET / SET Key', dataSource: 'String Key', output: 'Cache Hit/Miss', color: '#dc2626', provider: 'Redis' },
      ]
    },
    {
      group: 'Networking & Outbound',
      items: [
        { label: 'MQTT Publisher', action: 'Publish Topic', dataSource: 'JSON / Bytes', output: 'ACK Confirm', color: '#ff0055', provider: 'Mosquitto' },
        { label: 'Email (SMTP / API)', action: 'Send Message', dataSource: 'Email Config', output: 'Delivery Status', color: '#0284c7', provider: 'Resend / SMTP' },
        { label: 'SMS Notifications', action: 'Send SMS', dataSource: 'Phone & Text', output: 'Message SID', color: '#ef4444', provider: 'Twilio API' },
        { label: 'Firebase Push', action: 'Send FCM Msg', dataSource: 'FCM Token', output: 'Notification ID', color: '#f59e0b', provider: 'Firebase' }
      ]
    }
  ];

  onDragStart(e: DragEvent, preset: any) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify(preset));
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  async saveCurrentAsTemplate() {
    const data = this.flowComponent().getFlowState();
    const templateName = prompt("Enter a name for the Model (Mock MongoDB Save):", "Entity AI Pipeline");
    if (!templateName) return;

    // Mostra il toast di loading
    this.flowComponent().toastMessage.set(`Connecting to MongoDB Atlas...`);
    // Simula una chiamata di rete da 1.2s al backend
    await new Promise(r => setTimeout(r, 1200));

    this.savedTemplates.update(ts => [{ id: Date.now(), name: templateName, data }, ...ts]);

    this.flowComponent().toastMessage.set(`Template '${templateName}' saved successfully to cluster!`);
    setTimeout(() => this.flowComponent().toastMessage.set(null), 3500);
  }

  loadTemplate(tmpl: any) {
    if (!confirm(`Load template '${tmpl.name}'? Current unsaved flow will be replaced.`)) return;
    this.flowComponent().loadFlowState(tmpl.data);
    this.flowComponent().toastMessage.set(`Loaded template: '${tmpl.name}'`);
    setTimeout(() => this.flowComponent().toastMessage.set(null), 3500);
  }

  exportJson() {
    const data = this.flowComponent().getFlowState();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xyflow-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          this.flowComponent().loadFlowState(parsed);
          this.flowComponent().toastMessage.set(`Flow structure imported successfully!`);
          setTimeout(() => this.flowComponent().toastMessage.set(null), 3500);
        } else {
          alert("Invalid Format: Missing nodes or edges arrays.");
        }
      } catch (err) {
        alert("Invalid JSON file uploaded.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // reset the input so same file can trigger again
  }
}
