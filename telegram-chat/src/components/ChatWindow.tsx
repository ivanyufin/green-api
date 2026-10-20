import type { Chat, ChatMessage } from '../types.ts';
import {useEffect, useRef} from 'react';
import MessageBubble from "./MessageBubble.tsx";
import chatBg from '../assets/background.png';

type ChatWindowProps = {
    chatId: string | null;
    activeChat: Chat | undefined;
    messages: ChatMessage[];
    message: string;
    error: string;
    onMessageChange: (value: string) => void;
    onSendMessage: () => void;
};

export default function ChatWindow(props: ChatWindowProps) {
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!messagesContainerRef.current) return;
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }, [props.messages, props.chatId]);

    return (
        <main className='flex-1 min-w-0 bg-gray-100 p-4 flex flex-col h-full'>
            {props.chatId !== null && (
                <div className="flex flex-col gap-4 h-full min-h-0">

                    <h1 className="text-2xl font-bold p-2">
                        {props.activeChat?.phoneNumber ?? 'Активный чат не найден'}
                    </h1>

                    <div className='flex-1 min-h-0 overflow-y-auto' ref={messagesContainerRef} style={{
                        backgroundImage: `url(${chatBg})`,
                        backgroundRepeat: 'repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#efeae2',
                    }}>
                        <div className="min-h-full flex flex-col justify-end gap-2 py-3">
                            {
                                props.messages
                                    .filter(message => message.chatId === props.chatId)
                                    .map(message => (
                                        <MessageBubble key={message.id} message={message} />
                                    ))
                            }
                        </div>
                    </div>
                    <div className='flex items-center gap-3 shrink-0'>
                                <textarea
                                    id="message"
                                    rows={1}
                                    className='flex-1 min-w-0 h-11 resize-none overflow-y-auto rounded-xl border border-gray-200 px-3 py-2'
                                    placeholder="Введите сообщение..."
                                    onChange={(event)=>{props.onMessageChange(event.target.value)}}
                                    onKeyDown={(event)=>{
                                        if (
                                            event.key === 'Enter' &&
                                            !event.shiftKey &&
                                            !event.nativeEvent.isComposing &&
                                            !event.repeat
                                        ) {
                                            event.preventDefault();
                                            props.onSendMessage();
                                        }
                                    }}
                                    value={props.message}
                                />
                        <button
                            className="h-11 bg-blue-600 text-white px-4 rounded-xl shrink-0"
                            onClick={props.onSendMessage}
                        >
                            Отправить
                        </button>
                    </div>
                    {props.error !== '' &&
                        <span className='text-red-500'>{props.error}</span>
                    }
                </div>
            )
            }
            {props.chatId === null && (
                <div className="flex h-full items-center justify-center">
                    <p className="text-lg text-gray-400">
                        Выберите чат, чтобы начать переписку
                    </p>
                </div>
            )}
        </main>
    )
}