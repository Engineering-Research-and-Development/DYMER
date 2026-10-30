import { Component, OnInit } from '@angular/core';
import { Permissions } from './permission.interface';
import { PermissionService } from './permission.service';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '@shared';

@Component({
  selector: 'app-permissions-roles',
  standalone: true,
  imports: [FormsModule, CommonModule, MatCardModule, MatButtonModule, MatCheckboxModule, MatTableModule, MatIconModule, MatFormFieldModule, MatInputModule, TranslateModule, PageHeaderComponent],
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss'],
})


export class RolesComponent implements OnInit {
  baseRoleForm: Permissions = {
    role: '',
    perms: {
      entities: { view: [], create: [], edit: [], delete: [] },
      modules: { view: [], create: [], edit: [], delete: [] },
    },
  };

  formData: Permissions = structuredClone(this.baseRoleForm);
  typeRole: Permissions = structuredClone(this.baseRoleForm);
  listPerm: any[] = [];
  listRoles: Permissions[] = [];
  isSaving: boolean = false;

  constructor(
    private readonly permissionService: PermissionService,
    private readonly toast: ToastrService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    this.listPerm = await this.getListPerm();
    this.listRoles = await this.getListRoles();
  }

  private async getListPerm() {
    try {
      return await lastValueFrom(this.permissionService.getProcessedPermissions(this.baseRoleForm));
    } catch (error) {
      console.error('Error loading permissions:', error);
      return [];
    }
  }

  private async getListRoles() {
    try {
      let res = await lastValueFrom(this.permissionService.getPermissions());
      return res.data ?? [];
    } catch (error) {
      console.error('Error loading roles:', error);
      return [];
    }
  }

  saveConfigRules(formData: Permissions) {
    const roleName = formData.role?.trim();

    if (!roleName) {
      this.toast.error(this.translate.instant('menu.permissions.roles.nameRequired'), 'ERROR');
      console.error('Missing role name');
      return;
    }

    // Evito nomi di ruolo duplicati
    const exists = this.listRoles.some(
      r => r.role.toLowerCase() === roleName.toLowerCase()
    );


    if (exists) {
      this.toast.error(this.translate.instant('menu.permissions.roles.alreadyExists'), 'ERROR');
      console.error('Role already exists');
      return;
    }

    this.permissionService.saveConfigRules(formData).subscribe({
      next: () => {
        this.getListPerm().then(listPerm => this.listPerm = listPerm);
        this.getListRoles().then(listRoles => this.listRoles = listRoles);
        this.toast.success(this.translate.instant('menu.permissions.roles.created'), this.translate.instant('menu.actions.create'));
        this.formData.role = ''; // Pulisce il campo di input del ruolo
      },
      error: error => console.error('Error while saving config rules:', error),
    });
  }

  removeRole(id: string) {
    if (confirm(this.translate.instant('menu.permissions.roles.confirmDelete'))) {
      const index = this.listPerm.findIndex(obj => obj._id === id);
      this.permissionService.removeRole(id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('menu.permissions.roles.deleted'), this.translate.instant('menu.actions.delete'));
          this.getListPerm().then(listPerm => this.listPerm = listPerm);
          this.getListRoles().then(listRoles => this.listRoles = listRoles);
        },
        error: error => console.error('Error while deleting role:', error),
      });
    }
  }

  changePermission(role: any, f: string, e: any): boolean {
    const pos = this.listPerm.findIndex(x => x._id === role._id);

    if (pos === -1) return false;

    if (!this.listPerm[pos].perms.entities[f]) {
      this.listPerm[pos].perms.entities[f] = [];
    }

    const indexEnt = this.listPerm[pos].perms.entities[f].indexOf(e);

    if (indexEnt >= 0) {
      this.listPerm[pos].perms.entities[f].splice(indexEnt, 1);
    } else {
      this.listPerm[pos].perms.entities[f].push(e);
    }

    return true;
  }

  saveRole(formData: Permissions) {
    this.isSaving = true;
    console.log('Saving role:', formData);
    this.permissionService.saveRole(formData).subscribe({
      next: (response) => {
        console.log('Role saved successfully:', response);
        this.isSaving = false;
        this.getListPerm().then(listPerm => this.listPerm = listPerm);
        this.getListRoles().then(listRoles => this.listRoles = listRoles);
        this.toast.success(this.translate.instant('menu.permissions.roles.updated'), this.translate.instant('menu.actions.update'));
      },
      error: (error) => {
        console.error('Error while saving role:', error);
        this.isSaving = false;
        const errorMsg = error.name === 'TimeoutError' 
          ? 'Timeout: il backend ha impiegato troppo tempo a rispondere' 
          : 'Errore nel salvataggio del ruolo';
        this.toast.error(errorMsg, 'ERROR');
      },
    });
  }

  isChecked(role: any, entity: string, permissionKey: string): boolean {
    return role?.perms?.entities?.[permissionKey]?.includes(entity) ?? false;
  }
  protected readonly Object = Object;
}
