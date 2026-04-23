import { MatIconModule } from '@angular/material/icon';
import { DymerUser, JSONResponse } from './dymer-user.interface';
import { Component, inject } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { ToastrService } from 'ngx-toastr';
import { DymerUserService } from './dymer-user.service';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AddUserFormComponent } from './dialog/addUser.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { EditUserComponent } from './editUser/editUser.component';
import { PageHeaderComponent } from '@shared';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  imports: [MatButtonModule, MatCardModule, MatTableModule, MatIconModule, MatGridListModule, PageHeaderComponent, TranslateModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent {
  listUsers: DymerUser[] = [];
  dialog = inject(MatDialog);
  displayedColumns: string[] = [
    'username',
    'password',
    'email',
    'roles',
    'lastLogin',
    'ip',
    'active',
    'actions',
  ];

  constructor(
    private readonly toast: ToastrService,
    private readonly dymerUserService: DymerUserService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAllConfig();
  }

  async loadAllConfig(): Promise<void> {
    try {
      const response = await lastValueFrom(this.dymerUserService.loadAllConfig());
      this.listUsers = response.data;
    } catch (err) {
      console.error('Unbale serve HTTP due to:', err);
      this.toast.error('Unable to load data');
    }
  }

  async openAddUserDialog(): Promise<void> {
    (document.activeElement as HTMLElement)?.blur();

    const dialogRef = this.dialog.open(AddUserFormComponent);

    dialogRef.afterClosed().subscribe(async (userData: DymerUser) => {
      if (userData) {
        try {
          await lastValueFrom(this.dymerUserService.saveConfigDUser(userData));
          this.toast.success('New user correctly created', 'CREATE');
          await this.loadAllConfig();
        } catch (error) {
          console.error('Unable to save new user due to:', error);
        }
      }
    });
  }

  async removeConfigDUser(index: DymerUser) {
    if (!index ) {
      console.error('Invalid index for user removal.');
      return;
    }

    let userToRemove =  index ;
    if(userToRemove.username === 'admin'){
      this.toast.error('The admin user cannot be deleted.', 'DELETE ERROR');
      
    }else{
        if (confirm(`Do you want to delete ${userToRemove.username}?`)) {
              try {
                await lastValueFrom(this.dymerUserService.removeConfigDUser(userToRemove._id!));
                this.toast.success('User correctly removed', 'DELETE');
                await this.loadAllConfig();
              } catch (error) {
                console.error('Unable delete user due to:', error);
              }
            }
    }
     
  }

  UTCConvert(timestamp: string) {
    const utcdate = new Date(timestamp);
    const localDate = new Date(utcdate);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat(undefined, options);
    return formatter.format(localDate);
  }

async editConfigDUser(user: DymerUser): Promise<void> {
  (document.activeElement as HTMLElement)?.blur();

  const dialogRef = this.dialog.open(EditUserComponent, {
    width: '400px',
    data: user // Passa l'utente alla modale
  });

  dialogRef.afterClosed().subscribe(async (updatedUser: DymerUser) => {
    if (updatedUser) {
      try {
        await lastValueFrom(this.dymerUserService.editConfigDUser(updatedUser));
        this.toast.success('User updated successfully', 'UPDATE');
        await this.loadAllConfig();
      } catch (error) {
        console.error('Unable to update user due to:', error);
      }
    }
  });
}

}
