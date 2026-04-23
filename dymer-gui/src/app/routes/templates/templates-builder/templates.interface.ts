export interface PageTemplate {
  _id: string;
  title: string;
  author: string;
  description: string;

  instance: TemplateInstance[];
  files: TemplateFile[];

  viewtype: TemplateViewType[];

  properties: TemplateProperties;
}

export interface TemplateInstance {
  _index: string;
  _id: string;
}

export interface TemplateFile {
  _id: string;
  filename: string;
  contentType: string;
  data: string;
  md5: string;
  length: number;
  uploadDate: string;
}

export interface TemplateViewType {
  _id: string;
  rendertype: string;
}

export interface TemplateProperties {
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