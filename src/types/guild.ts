export interface GuildDef {
  id: string;
  name: string;
  glyph: string;
  level: number;
  members: number;
  maxMembers: number;
  description: string;
  ai: boolean;
}

export interface GuildMember {
  id: string;
  name: string;
  level: number;
  contribution: number;
  role: 'leader' | 'officer' | 'member';
  isPlayer?: boolean;
}
