declare module "mammoth" {
  export interface MammothMessage {
    type: "warning" | "error";
    message: string;
  }

  export interface MammothResult {
    value: string;
    messages: MammothMessage[];
  }

  export interface MammothInput {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(input: MammothInput): Promise<MammothResult>;
}
