import type {ChatMessage} from '../types.ts'

type MessageBubbleProps = {
    message: ChatMessage,
}

export default function MessageBubble({message}: MessageBubbleProps) {
    return (

        <div className={`flex 
                                            ${
            message.direction === 'outgoing'
                ? 'justify-end'
                : 'justify-start'
        }
                                             
                                            `}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 wrap-break-word mx-4
                                                    ${message.direction === 'outgoing'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'}
                                                `}>
                {message.text}
            </div>
        </div>
    )
}