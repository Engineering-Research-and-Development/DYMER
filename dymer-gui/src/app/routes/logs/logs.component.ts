import { Component, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { PageHeaderComponent } from '@shared';
import { LogsService } from './logs.service';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { CheckService } from './logs.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DialogInfoLog } from './dialog/infolog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-logs',
  imports: [
    MatCheckboxModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    TranslateModule
  ],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent {
  dialog = inject(MatDialog);

  private uuidfile: string = '';
  private statusStandard: string = 'Service down';
  private stateserv: string = 'text-danger';
  private bdstandard: string = 'Disconnected';
  public checkservice: any;
  panelOpenState = false;
  public configLog: any = {};
  private httpClient: HttpClient;

  formCONF!: FormGroup;
  logOptions = [
    {
      label: 'menu.logs.consoleLogs',
      key: 'consoleactive',
      services: [
        { label: 'Webserver Microservice', key: 'webserver' },
        { label: 'Entities Microservice', key: 'entity' },
        { label: 'Service Microservice', key: 'service' },
        { label: 'Model Microservice', key: 'form' },
        { label: 'Template Microservice', key: 'template' },
      ],
    },
    {
      label: 'menu.logs.redisEnable',
      key: 'redisactive',
      services: [{ label: 'Entities Microservice', key: 'entity' }],
    },
    /*AC Multitenancy start */
    {
      label: 'menu.logs.multitenancyEnable',
      key: 'multitenancyactive',
      services: [{ label: 'Entities Microservice', key: 'entity' }]
    }
    /*AC Multitenancy end */
  ];

  constructor(
    private readonly logService: LogsService,
    private readonly toast: ToastrService,
    private fb: FormBuilder,
    private http: HttpClient,
    private handler: HttpBackend
  ) {
    this.httpClient = new HttpClient(handler);
    this.checkservice = {
      entities: {
        state: this.stateserv,
        msg: this.statusStandard,
        db: {
          mongo: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
          elastic: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
          redis: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
        },
        multitenancy: {
          msg: this.bdstandard,
          css: this.stateserv
        }
      },
      dservice: {
        state: this.stateserv,
        msg: this.statusStandard,
        db: {
          mongo: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
        },
      },
      forms: {
        state: this.stateserv,
        msg: this.statusStandard,
        db: {
          mongo: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
        },
      },
      templates: {
        state: this.stateserv,
        msg: this.statusStandard,
        db: {
          mongo: {
            msg: this.bdstandard,
            css: this.stateserv,
          },
        },
      },
      webserver: {
        state: 'text-success',
        msg: 'Service up',
      },
    };
  }

  ngOnInit(): void {
    this.logTypes();
    this.checkService();
    this.checkEntitiesService();
    this.checkServicesService();
    this.checkFormsService();
    this.checkTemplatesService();
    this.checkMultitenancyService();

    const group: any = {};

    for (const logType of this.logOptions) {
      group[logType.key] = this.fb.group({});

      for (const service of logType.services) {
        const control = this.fb.control({ value: false, disabled: logType.key === 'redisactive' });
        (group[logType.key] as FormGroup).addControl(service.key, control);
      }
    }

    this.formCONF = this.fb.group(group);
  }

  async logTypes(): Promise<void> {
    try {
      const logTypes: any = await lastValueFrom(this.logService.logTypes());
      // console.log('logTypes', logTypes)
      this.configLog.consoleactive = logTypes.data.consoleactive;
      this.configLog.redisactive = logTypes.data.redisactive;
      this.configLog.multitenancyactive = logTypes.data.multitenancyactive;
      this.updateCheckboxValues();
    } catch (error) {
      this.toast.error('Error loading log types');
      console.error('Error loading log types:', error);
    }
  }

  async checkService(): Promise<void> {
    try {
      const checkService = await lastValueFrom(this.logService.checkService());
      this.checkservice.webserver.logs = checkService.data;
    } catch (error) {
      this.toast.error('Failed to load service status');
      console.error('Error loading check Service:', error);
    }
  }

  async checkEntitiesService(): Promise<void> {
    try {
      const [
        checkEntitiesService,
        entitiesMongoState,
        uuid,
        entitiesElasticState,
        entitiesRedisState,
      ]: any = await Promise.all([
        lastValueFrom(this.logService.checkEntitiesService()),
        lastValueFrom(this.logService.mongoEntitiesState()),
        lastValueFrom(this.logService.getEntitiesUUID()),
        lastValueFrom(this.logService.elasticEntitiesState()),
        lastValueFrom(this.logService.redisEntitiesState()),
      ]);

      this.checkservice.entities = {
        ...this.checkservice.entities,
        msg: checkEntitiesService.message,
        logs: checkEntitiesService.data,
        state: 'text-success',
        db: {
          mongo: {
            css: entitiesMongoState.data.css,
            msg: entitiesMongoState.data.label,
          },
          elastic: {
            css: entitiesElasticState.data.css,
            msg: entitiesElasticState.data.label,
          },
          redis: {
            css: entitiesRedisState.data.css,
            msg: entitiesRedisState.data.label,
            value: entitiesRedisState.data.value === 1,
          },
        },
      };

      this.uuidfile = uuid.data.uuid;
    } catch (error) {
      this.toast.error('Error loading check Entities Service');
      console.error('Error loading check Entities Service:', error);
    }
  }

  async checkServicesService(): Promise<void> {
    try {
      const checkServicesService: any = await lastValueFrom(this.logService.checkServices());
      const mongoServicesService: any = await lastValueFrom(this.logService.mongoServicesState());

      this.checkservice.dservice.msg = checkServicesService.message;
      this.checkservice.dservice.logs = checkServicesService.data;
      this.checkservice.dservice.state = 'text-success';

      this.checkservice.dservice.db!.mongo!.css = mongoServicesService.data.css;
      this.checkservice.dservice.db!.mongo!.msg = mongoServicesService.data.label;
    } catch (error) {
      this.toast.error('Error loading check Services Service');
      console.error('Error loading check Services Service:', error);
    }
  }

  async checkFormsService(): Promise<void> {
    try {
      const checkFormsService: any = await lastValueFrom(this.logService.checkFormsService());
      const mongoFormsService: any = await lastValueFrom(this.logService.mongoFormsService());

      this.checkservice.forms.msg = checkFormsService.message;
      this.checkservice.forms.logs = checkFormsService.data;
      this.checkservice.forms.state = 'text-success';

      this.checkservice.forms.db!.mongo!.css = mongoFormsService.data.css;
      this.checkservice.forms.db!.mongo!.msg = mongoFormsService.data.label;
    } catch (error) {
      this.toast.error('Error loading check Forms Service');
      console.error('Error loading check Forms Service:', error);
    }
  }

  async checkTemplatesService(): Promise<void> {
    try {
      const checkTemplatesService: any = await lastValueFrom(
        this.logService.checkTemplatesService()
      );
      const mongoTemplatesService: any = await lastValueFrom(this.logService.mongoTemplatesState());

      this.checkservice.templates.msg = checkTemplatesService.message;
      this.checkservice.templates.logs = checkTemplatesService.data;
      this.checkservice.templates.state = 'text-success';

      this.checkservice.templates.db!.mongo!.css = mongoTemplatesService.data.css;
      this.checkservice.templates.db!.mongo!.msg = mongoTemplatesService.data.label;

    } catch (error) {
      this.toast.error('Error loading check Templates Service');
      console.error('Error loading check Templates Service:', error);
    }
  }

  async openLog(service: string, typelog: string): Promise<void> {
    if (confirm(`Do you want to open ${typelog} to the service: ${service}?`)) {
      try {
        let pathOpLog = '';
        let tpop = 'openLog/';
        switch (service) {
          case 'webserver':
            pathOpLog = '/' + tpop + typelog;
            break;
          default:
            pathOpLog = '/api/' + service + '/' + tpop + typelog;
            break;
        }

        const rt = await lastValueFrom(this.httpClient.get(pathOpLog, { responseType: 'text' }));

        let d = new Date();
        let date = d.toISOString().split('T')[0].replace(/-/g, '_');
        let time = d.toTimeString().split(' ')[0].replace(/:/g, '_');

        let blob = new Blob([rt]);
        let linkElement = document.createElement('a');
        let url = window.URL.createObjectURL(blob);

        let filename =
          this.uuidfile + '_' + service + '_' + typelog + '_' + date + '_' + time + '.log';
        linkElement.setAttribute('href', url);
        linkElement.setAttribute('download', filename);

        let clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: false,
        });

        linkElement.dispatchEvent(clickEvent);
      } catch (error) {
        this.toast.error('Error opening log');
        console.error('Unable to open log due to:', error);
      }
    }
  }

  async deleteLog(service: string, typelog: string): Promise<void> {
    if (confirm(`Do you want to delete ${typelog} for ${service}?`)) {
      try {
        let pathOpLog = '';
        const tpop = 'deletelog/';

        switch (service) {
          case 'webserver':
            pathOpLog = `/${tpop}${typelog}`;
            break;
          default:
            pathOpLog = `/api/${service}/${tpop}${typelog}`;
            break;
        }

        await lastValueFrom(this.logService.getPathOpLog(pathOpLog));
        this.toast.success(`Log ${typelog} deleted for ${service}`);

        // Ricarica i log aggiornati
        await this.checkService();
      } catch (error) {
        this.toast.error(`Failed to delete log: ${typelog}`);
        console.error(error);
      }
    }
  }

  async saveConfigLog(opnconf: any): Promise<void> {
    console.log("opnconf", opnconf)
    const response: any = await lastValueFrom(this.logService.saveConfigLog(opnconf));

    try {
      if (response.success) {
        if (response.data.redisactive.entity.value == 1) {
          this.checkservice.entities.db!.redis!.value = true;
        } else {
          this.checkservice.entities.db!.redis!.value = false;
        }

        this.checkservice.entities.db!.redis!.css = response.data.redisactive.entity.css;
        this.checkservice.entities.db!.redis!.msg = response.data.redisactive.entity.label;
        this.toast.success('Log configuration saved');
      }
    } catch (error) {
      this.toast.error('Error saving log');
      console.error('Unable to save log due to:', error);
    }
  }

  updateCheckboxValues() {
    if (!this.configLog || !this.formCONF) return;

    this.formCONF.patchValue({
      consoleactive: {
        webserver: this.configLog.consoleactive?.webserver ?? false,
        entity: this.configLog.consoleactive?.entity ?? false,
        service: this.configLog.consoleactive?.service ?? false,
        form: this.configLog.consoleactive?.form ?? false,
        template: this.configLog.consoleactive?.template ?? false,
      },
      redisactive: {
        entity: this.configLog.redisactive?.entity ?? false,
      },
      multitenancyactive: {
        entity: this.configLog.multitenancyactive?.entity ?? false,
      },
    });
  }

  onSubmitCheckbox() {
    const raw = this.formCONF.getRawValue();

    const payload = {
      consoleactive: {
        webserver: raw.consoleactive.webserver,
        entity: raw.consoleactive.entity,
        service: raw.consoleactive.service,
        form: raw.consoleactive.form,
        template: raw.consoleactive.template,
      },
      redisactive: {
        entity: raw.redisactive.entity ?? false,
      },
      multitenancyactive: { 
        entity: raw.multitenancyactive.entity ?? false 
      },
    };
    this.configLog = payload;
    this.saveConfigLog(payload);
  }

  openLogDialog(microservice: keyof CheckService) {
    console.log('openLogDialog', microservice);
    let infoLog = this.checkservice[microservice].logs.infomicroservice;
    console.log('infoLog', infoLog);
    console.log('microservice', microservice);

    this.dialog.open(DialogInfoLog, {data: infoLog});

  }

  /*AC multitenancy start */
  async checkMultitenancyService(): Promise<void> {
    try {
      const multitenancyState: any = await lastValueFrom(this.logService.multitenancyState());
      this.configLog.multitenancyactive = { entity: multitenancyState.data.entity };
      this.updateCheckboxValues();
    } catch (error) {
      this.toast.error('Error loading multitenancy state');
      console.error('Error loading multitenancy state:', error);
    }
  }
  /*AC multitenancy end */
}