 
import { Component, Input, OnInit, ViewEncapsulation, inject } from '@angular/core';

import { CommonModule } from '@angular/common';  
import { color } from 'd3';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  templateUrl: './stats-card.component.html',
   imports: [CommonModule],  
  encapsulation: ViewEncapsulation.None,
  styleUrl: './stats-card.component.scss'
})
export class StatsCardComponent implements OnInit {


   
 constructor() { }


  @Input() value: number = 0;
  
  @Input() progress: string = '80%'; // es: "80%"
  
  @Input() colorCode: string = '#007bff'; 
  @Input() label: string = 'KPI';
  @Input() kpiNumber: number = 0;
  @Input() icon: string = 'fa-solid fa-square';  
  

  ngOnInit(): void {
  }

  
 get iconStyle() {
    /*return {
      'color': this.colorCode
    };*/
    return { backgroundColor: this.colorCode, color: '#fff' };
  }
 
   
  get kpiNumberStyle() {
    return {
      'color': this.colorCode 
    };
  }
}
