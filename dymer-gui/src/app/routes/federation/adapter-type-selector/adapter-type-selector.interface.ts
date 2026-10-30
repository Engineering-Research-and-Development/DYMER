import { AdapterType } from "../federation.interface";

export interface AdapterOption {
  value: AdapterType;
  label: string;
  description: string;
  available: boolean;
}