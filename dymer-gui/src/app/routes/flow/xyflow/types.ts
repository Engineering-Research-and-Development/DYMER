export interface XYNodeData {
  label: string;
  action?: string;
  dataSource?: string;
  output?: string;
  color?: string;
  jsonIndex?: string;
  provider?: string;
}

export interface XYNode {
  id: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  data: XYNodeData;
}

export interface XYEdge {
  id: string;
  source: string;
  target: string;
}
