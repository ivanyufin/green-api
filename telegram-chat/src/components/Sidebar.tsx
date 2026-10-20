import type {Chat} from '../types.ts'

type SidebarProps = {
    chats: Chat[];
    chatId: string | null;
    phoneNumber: string;
    error: string;
    onPhoneNumberChange: (value: string) => void;
    onSearchUser: () => void;
    onSelectChat: (chatId: string) => void;
};

export default function Sidebar(props: SidebarProps) {
    return (
        <aside className='w-80 shrink-0 border-r border-gray-200 bg-white p-4'>

            <div className="flex flex-col gap-4">
                <h1 className="text-xl font-semibold">Новый чат</h1>
                <label htmlFor="phoneNumber" className="text-sm text-gray-600 p-2">Номер телефона</label>
                <input
                    type="text"
                    id="phoneNumber"
                    className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                    placeholder="79991234567"
                    onChange={(event)=>{props.onPhoneNumberChange(event.target.value)}}
                    value={props.phoneNumber}
                />
                <button
                    className="bg-blue-600 text-white p-2 rounded-lg"
                    onClick={props.onSearchUser}
                >
                    Добавить чат
                </button>
                <h1 className='text-3xl font-bold p-2'>Мои чаты</h1>
                <div>
                    {
                        props.chats.map(chat => (
                            <button
                                key={chat.chatId}
                                onClick={() => {props.onSelectChat(chat.chatId)}
                                }
                                className={`w-full text-left p-3 rounded-lg ${
                                    chat.chatId === props.chatId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                                }`}
                            >{chat.phoneNumber}</button>
                        ))
                    }
                </div>
                {props.error !== '' &&
                    <span className='text-red-500'>{props.error}</span>
                }
            </div>
        </aside>
    )
}