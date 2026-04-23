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
import { TranslateModule } from '@ngx-translate/core';
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

  displayedColumns: string[] = ['entity', 'view', 'create', 'edit', 'delete', 'actions'];

  constructor(
    private readonly permissionService: PermissionService,
    private readonly toast: ToastrService
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
      return await lastValueFrom(this.permissionService.getPermissions());
    } catch (error) {
      console.error('Error loading roles:', error);
      return [];
    }
  }

  saveConfigRules(formData: Permissions) {
    this.permissionService.saveConfigRules(formData).subscribe({
      next: () => {
        this.getListPerm().then(listPerm => this.listPerm = listPerm);
        this.getListRoles().then(listRoles => this.listRoles = listRoles);
        this.toast.success('New role correctly created', 'CREATE');
      },
      error: error => console.error('Error while saving config rules:', error),
    });
  }

  removeRole(id: string) {
    if (confirm('Do you want to delete this role?')) {
      const index = this.listPerm.findIndex(obj => obj._id === id);
      this.permissionService.removeRole(this.listPerm[index]._id).subscribe({
        next: () => this.listPerm.splice(index, 1),
        error: error => console.error('Error while deleting role:', error),
      });
    }
  }

  changePermission(index: any, f: string, e: any): boolean {
    const pos = this.listPerm.findIndex(x => x._id === index._id);

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
    this.permissionService.saveRole(formData).subscribe({
      next: () => {
        this.getListPerm().then(listPerm => this.listPerm = listPerm);
        this.getListRoles().then(listRoles => this.listRoles = listRoles);
        this.toast.success('Permission correctly updated', 'UPDATE');
      },
      error: error => console.error('Error while saving config rules:', error),
    });
  }

  isChecked(entityPermission: any, permissionKey: string): boolean {
    const foundFunction = entityPermission.functions.find(
      (func: any) => func.operations === permissionKey
    );
    return foundFunction ? foundFunction.checked : false;
  }
  protected readonly Object = Object;
}
