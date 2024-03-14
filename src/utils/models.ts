export interface MessageModel {
  platform: string;
  messageType: string;
  id: string;
  authorName: string;
  message: string;
  imgSrcs?: string[];
  badgeSvgs?: string[];
  authorColor: string;
  replyingTo?: string;
  subscriptionInfo?: string;
  timestamp: Date;
}

export interface DonationModel {
  platform: string;
  messageType: string;
  authorName: string;
  message: string;
  purchaseAmount: string;
  timestamp: string;
  gradient: string;
  authorPhotoSrc: string;
}

export interface Emote {
  data: string; // Base64 encoded image data
  name: string; // File name without the .webp extension
}


export type Badge = 'moderator' | 'vip' | 'prime' | 'turbo'