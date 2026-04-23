export interface ModelPage {
  _id: string;
  title: string;
  author: string;
  description: string;
  posturl: string;

  instance: ModelInstance[];
  files: ModelFile[];

  properties: ModelProperties;
  structure: ModelStructure;
  
  createdAt: Date;
}

export interface ModelInstance {
  _index: string;
  _id: string;
}

export interface ModelFile {
  _id: string;
  filename: string;
  contentType: string;
  data: string;
  md5: string;
  length: number;
  uploadDate: string;
}

export interface ModelProperties {
  owner: {
    uid: string;
    gid: string;
  };

  grant: Permission;
  update: Permission;
  delete: Permission;

  created: string;
  changed: string;
}

export interface Permission {
  view: {
    uid: string[];
    gid: string[];
  };
}

export interface ModelStructure {
  node: string;
  child: StructureNode[];
}

export interface StructureNode {
  node: 'element';
  tag: string;
  attr: Record<string, any>;
}
