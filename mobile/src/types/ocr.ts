export interface TextBlock {
  text: string;
  confidence: number;
}

export interface OCRResponse {
  blocks: TextBlock[];
  raw_text: string;
}
