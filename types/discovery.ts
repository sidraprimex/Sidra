export interface DiscoveryStudio {
  id: string;
  slug: string;
  name: string;
  heroImageUrl: string | null;
  storyFragment: string | null;
}
export interface HandwritingPoint { x: number; y: number; t: number; }
export type HandwritingStroke = HandwritingPoint[];
export interface HandwritingRecognitionResult { recognizedText: string; matchedStudio: DiscoveryStudio | null; }
