import { Component, inject } from '@angular/core';
import { PageHeaderComponent } from '@shared';
import { ToastrService } from 'ngx-toastr';
import { AuthConfigService } from './authorization.service';
import { lastValueFrom } from 'rxjs';
import { AuthorizationRules } from './authorization.interface';
import { CommonModule } from '@angular/common';
import { NewAuthConfigComponent } from './dialog/new-auth-config.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
 
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-permissions-authorization',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatTableModule,TranslateModule,PageHeaderComponent],
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss']
})
export class AuthorizationComponent {
  listAuthConfig: AuthorizationRules[] = [];
  showProps: boolean[] = [];
  dialog = inject(MatDialog);

  displayedColumns: string[] = ['requestUrl', 'enabled', 'type', 'properties', 'actions'];

  constructor(
    private readonly toast: ToastrService,
    private readonly authConfigService: AuthConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAllConfig();
  }

  async loadAllConfig(): Promise<void> {
    try {
      const response = await lastValueFrom(this.authConfigService.loadAllConfig());
      this.listAuthConfig = response.data;
      this.showProps = new Array(this.listAuthConfig.length).fill(false);
    } catch (err) {
      console.error('Unbale serve HTTP due to:', err);
      this.toast.error('Unable to load data');
    }
  }

  toggleProps(index: number): void {
    this.showProps[index] = !this.showProps[index];
  }

  async openNewAuthConfigDialog(existingConfig?: AuthorizationRules): Promise<void> {
    (document.activeElement as HTMLElement)?.blur();

    const dialogRef = this.dialog.open(NewAuthConfigComponent, {
      data: existingConfig || null
    });

    dialogRef.afterClosed().subscribe(async (newConfig: AuthorizationRules) => {
      if (newConfig) {
        try {
          await lastValueFrom(this.authConfigService.saveConfigAuthentication(newConfig));
          const msg = existingConfig ? 'Configuration successfully updated' : 'New configuration successfully created';
          this.toast.success(msg, existingConfig ? 'UPDATE' : 'CREATE');
          await this.loadAllConfig();
        } catch (error) {
          console.error('Unable to save new configuration due to:', error);
        }
      }
    });
  }

  async removeConfig(index: number) {
    if (index < 0 || index >= this.listAuthConfig.length) {
      console.error('Invalid index for user removal.');
      return;
    }

    let userToRemove = this.listAuthConfig[index];
    if (confirm(`Do you want to delete this ${userToRemove.authtype}?`)) {
      try {
        await lastValueFrom(this.authConfigService.removeConfigAuthentication(userToRemove._id!));
        this.toast.success('Configuration correctly removed', 'DELETE');
        await this.loadAllConfig();
      } catch (error) {
        console.error('Unable delete configuration due to:', error);
      }
    }
  }

  async duplicateConfig(index: number, tp: string) {
    if (index < 0 || index >= this.listAuthConfig.length) {
      console.error('Invalid index for user removal.');
      return;
    }

    let userToDuplicate = JSON.parse(JSON.stringify(this.listAuthConfig[index]));

    delete userToDuplicate._id;

    // Open modal form
    const dialogRef = this.dialog.open(NewAuthConfigComponent, {
      data: userToDuplicate,
    });

    dialogRef.afterClosed().subscribe(async (newConfig: AuthorizationRules) => {
      if (newConfig) {
        try {
          await lastValueFrom(this.authConfigService.saveConfigAuthentication(newConfig));
          this.toast.success('Configuration updated and saved', 'CREATE');
          await this.loadAllConfig();
        } catch (error) {
          console.error('Error while duplicating configuration:', error);
        }
      }
    });
  }
}
// This code is part of the Dymer project, which is licensed under the GNU General Public License v3.0.
// For more information, see the LICENSE file in the root directory of this project.  