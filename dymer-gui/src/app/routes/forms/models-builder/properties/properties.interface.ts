export interface NavigatorNode {
  id: string;
  tagName: string;
  idAttr: string;
  depth: number;
  element: HTMLElement;
  hasChildren: boolean;
  expanded: boolean;
}