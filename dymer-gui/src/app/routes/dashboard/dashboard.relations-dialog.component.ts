import { Component, Inject, AfterViewInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import * as d3 from 'd3';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  scaleOrdinal,
  schemeCategory10,
  drag,
  SimulationNodeDatum,
} from 'd3';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-relations-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'menu.dashboard.relations.graph' | translate }}</h2>
    <mat-dialog-content class="graph-container">
      <figure #graphContainer id="graph" style="width: 100%; height: 100%; margin: 0;"></figure>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'menu.actions.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .graph-container {
      width: 100%;
      height: 500px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  encapsulation: ViewEncapsulation.None
})
export class RelationsDialogComponent implements AfterViewInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  private nodes: any = {
    "nodes": [],
    "links": []
  };
  private color = scaleOrdinal(schemeCategory10);
  private width = 800;
  private height = 500;

  constructor(
    public dialogRef: MatDialogRef<RelationsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngAfterViewInit() {
    if (this.data) {
      this.createSvg(this.data);
    }
  }

  createSvg(allRelations: any) {
    this.nodes = { "nodes": [], "links": [] };
    
    /*Valorizzazione nodi*/
    for (let relation of allRelations.data) {
      let newitm = {
        "name": relation.key,
        "group": relation.key
      }
      if (this.nodes.nodes.find((x: any) => x.name === relation.key) == undefined) {
        this.nodes.nodes.push(newitm)
      }
      relation._index2.buckets.forEach((sub: any) => {
        let newSitm = { "name": sub.key, "group": sub.key, "doc_count": sub.doc_count };
        if (this.nodes.nodes.find((x: any) => x.name === sub.key) == undefined) {
          this.nodes.nodes.push(newSitm)
        }
      });
    }
    /*Valorizzazione links fra i nodi*/
    for (let relation of allRelations.data) {
      let sourc = this.nodes.nodes.find((x: any) => x.name === relation.key);
      relation._index2.buckets.forEach((sub: any) => {
        let targ = this.nodes.nodes.find((x: any) => x.name === sub.key);
        let newLk = {
          "source": sourc,
          "target": targ,
          "title": sub.doc_count
        };
        this.nodes.links.push(newLk)
      });
    };

    /*Visualizzazione grafo*/
    const element = this.graphContainer.nativeElement;
    d3.select(element).selectAll("*").remove();

    this.width = element.clientWidth || 800;
    this.height = element.clientHeight || 500;

    const svg = d3.select(element)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .append("g");

    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.nodes.links)
      .join('line');

    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(this.nodes.nodes)
      .enter()
      .append('g');

    const circles = node
      .append('circle')
      .attr('r', 10)
      .style('fill', (n: any) => this.color(n.group))
      .style('cursor', 'pointer')
      .on('dblclick', (e: any) => alert(e.srcElement.__data__.name))
      .call(
        drag<SVGCircleElement, any>()
          .on('start', (e, d: any) => dragstarted(e, d))
          .on('drag', (e, d: any) => dragged(e, d))
          .on('end', (e, d: any) => dragended(e, d))
      );

    const labels = node
      .append('text')
      .text((n: any) => n.name)
      .attr('x', 12)
      .attr('y', 3)
      .style('font-size', '12px')
      .attr('fill', (n: any) => this.color('' + n.group));

    node.append('title').text((n: any) => n.doc_count);

    const simulation = forceSimulation(this.nodes.nodes)
      .force(
        'link',
        forceLink(this.nodes.links).id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(this.width / 2, this.height / 2))
      .tick()
      .on('tick', () => {
        node.attr('transform', (n: any) => 'translate(' + n.x + ',' + n.y + ')');
        link
          .attr('x1', (l: any) => l.source.x)
          .attr('y1', (l: any) => l.source.y)
          .attr('x2', (l: any) => l.target.x)
          .attr('y2', (l: any) => l.target.y);
      });

    const dragstarted = (e: any, d: SimulationNodeDatum) => {
      if (!e.active) {
        simulation.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (e: any, d: SimulationNodeDatum) => {
      d.fx = e.x;
      d.fy = e.y;
    };

    const dragended = (e: any, d: SimulationNodeDatum) => {
      if (!e.active) {
        simulation.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    };
  }
}