export type ChatMessage = {
    id: string;
    chatId: string;
    text: string;
    direction: 'incoming' | 'outgoing';
};

export type Chat = {
    chatId: string;
    phoneNumber: string;
};