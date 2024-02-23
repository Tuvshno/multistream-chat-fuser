export interface MessageModel {
  platform: string;
  messageType: string;
  id: string;
  authorName: string;
  message: string;
  imgSrcs: string[];
  authorColor: string;
  replyingTo?: string;
  subscriptionInfo? : string;
}


export type Badge = 'moderator' | 'vip' | 'prime' | 'turbo'