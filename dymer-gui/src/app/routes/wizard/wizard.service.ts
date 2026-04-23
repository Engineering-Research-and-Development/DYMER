import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '@core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class WizardService {
  private apiService = inject(ApiService);
  private baseContextPath = this.apiService.endpoints.wizard;
  constructor(private client: HttpClient) {}
  getModelHtml(): Observable<string> { // 
    return this.client.get(this.baseContextPath.getModelHtml, {
      responseType: 'text', 
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`getModelHtml Error fetching ${this.baseContextPath.getModelHtml}:`, error);
        return throwError(() => new Error('Failed to load model html ===> ' + error.message));
      })
    );
  }
  createModel(modelData: FormData): Observable<any> {
    return this.client.post(this.baseContextPath.createModel, modelData, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`createModel Error fetching ${this.baseContextPath.createModel}:`, error);
        return throwError(() => new Error('Failed to create model ===> ' + error.message));
      })
    );
  }
  updateModelStructure(modelData: FormData): Observable<any> {
    return this.client.post(this.baseContextPath.updateModelStructure, modelData, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`updateModel Error fetching ${this.baseContextPath.updateModelAsset}:`, error);
        return throwError(() => new Error('Failed to update model ===> ' + error.message));
      })
    );
  }
  updateModelAsset(modelData: FormData): Observable<any> {
    return this.client.post(this.baseContextPath.updateModelAsset, modelData, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`updateModel Error fetching ${this.baseContextPath.updateModelStructure}:`, error);
        return throwError(() => new Error('Failed to update model ===> ' + error.message));
      })
    );
  }
  getModelDetail(index: any): any { // 
    const params = new HttpParams().set(
      'query',
      JSON.stringify({ 'instance._index': index })
    );
    return this.client.get(this.baseContextPath.getModelDetail, {params, withCredentials: true });
  }
  createTemplate(templateData: FormData): Observable<any> {
    return this.client.post(this.baseContextPath.createTemplate, templateData, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`createTemplate Error fetching ${this.baseContextPath.createTemplate}:`, error);
        return throwError(() => new Error('Failed to create template ===> ' + error.message));
      })
    );
  }
  getTemplateHtml(templateType:any): Observable<string> { // 
    return this.client.get(this.baseContextPath.getTemplateHtml+"-"+templateType+".html", {
      responseType: 'text', 
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error(`getTemplateHtml Error fetching ${this.baseContextPath.getTemplateHtml+"-"+templateType+".html"}:`, error);
        return throwError(() => new Error('Failed to load template html ===> ' + error.message));
      })
    );
  }
  
  getVocabularies(): any { // 
    const params = new HttpParams().set(
      'query',
      JSON.stringify({ 'instance._index': { "$eq": "general" } })
    );
    return this.client.get(this.baseContextPath.getVocabularies, {params, withCredentials: true });
  }
  getRelations(): any { // 
    return this.client.get(this.baseContextPath.getRelations, {withCredentials: true });
  }
}
