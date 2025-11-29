export type Beat = "hook" | "problem" | "solution" | "payoff" | "cta" | "outro";

export interface Research {
  id: string;
  topic: string;
  brand_voice: string;
  target: string;
  audience_insights: string[];
  hooks: string[];
  product_benefits: string[];
  example_formats: string[];
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  image_path: string;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  image_path: string;
}

export interface Dialogue {
  voiceover: string;
  on_screen_text?: string;
}

export interface Timing {
  duration_sec: number;
  beat: Beat;
}

export interface Scene {
  id: string;
  order: number;
  title: string;
  visual: string;
  environment_id: string;
  character_ids: string[];
  dialogue: Dialogue;
  timing: Timing;
}

export interface Storyboard {
  run_id: string;
  topic: string;
  characters: Character[];
  environments: Environment[];
  scenes: Scene[];
}

export type RunStatus = "queued" | "processing" | "done" | "error";

export interface StatusPayload {
  run_id: string;
  status: RunStatus;
  message?: string;
}
