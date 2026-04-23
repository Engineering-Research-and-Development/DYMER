 
import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';

import { CommonModule } from '@angular/common';  

@Component({
  selector: 'app-kpi-minicard',
  standalone: true,  
  imports: [CommonModule],  
  encapsulation: ViewEncapsulation.None,
  templateUrl: './kpi-minicard.component.html',
  styleUrl: './kpi-minicard.component.scss'
})
export class KpiMinicardComponent implements OnInit {

  @Input() colorCode: string = '#007bff'; 
  @Input() label: string = 'KPI';
  @Input() kpiNumber: number = 0;
  @Input() icon: string = 'fa-solid fa-square';  
  

  constructor() { }
  
   kpis = [
        { label: 'Indici', number: 34, icon: 'fa-solid fa-chart-line', color: '#007bff' },
        { label: 'Modelli', number: 0, icon: 'fa-solid fa-cube', color: '#ffc107' },
        { label: 'Templates', number: 101, icon: 'fa-solid fa-file-alt', color: '#28a745' },
        { label: 'Entità', number: 1137, icon: 'fa-solid fa-database', color: '#dc3545' },
        { label: 'Relazioni', number: 2388, icon: 'fa-solid fa-link', color: '#6f42c1' }
    ];

  ngOnInit(): void {
  }

   
  get iconStyle() {
    return {
      'color': this.colorCode  
    };
  }

   
  get kpiNumberStyle() {
    return {
      'color': this.colorCode 
    };
  }
}