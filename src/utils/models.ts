export interface MessageModel {
  platform: string;
  id: string;
  authorName: string;
  message: string;
  imgSrcs: string[];
  authorColor: string;
}


export type Badge = 'moderator' | 'vip' | 'prime' | 'turbo'