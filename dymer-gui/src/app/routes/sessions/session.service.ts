import { Injectable } from '@angular/core';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class SessionService {

  public pollingTimer: any = null;

  constructor(private router: Router) {
  }      
  
  setLoggedUser(username: any, token: any) {
    localStorage.setItem('user', JSON.stringify({
      username, token
    }));
  }

  getLoggedUser() {
    const loggedUser = localStorage.getItem('user');
    if(loggedUser) {
      return JSON.parse(loggedUser);
    }
    return null;
  }  

  deleteSession() {
    localStorage.removeItem('activeDymer');
  }

  deleteUserSession() {
    localStorage.removeItem('user');
    clearInterval(this.pollingTimer);
  }

  getActiveDymer() {
    const activeDymer = localStorage.getItem('activeDymer');
    if(activeDymer) {
      return JSON.parse(activeDymer);
    }
    return null;
  }
}


