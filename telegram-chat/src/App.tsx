import {useState, useEffect, useRef} from "react";

export default function App() {
    type ChatMessage = {
        id: string;
        chatId: string;
        text: string;
        direction: 'incoming' | 'outgoing';
    };

    type Chat = {
        chatId: string;
        phoneNumber: string;
    };

    const [chats, setChats] = useState<Chat[]>(() => {
        try {
            const telegram_chats = localStorage.getItem("telegram_chats");
            if (telegram_chats === null) {
                return [];
            }
            else
            {
                const parsed = JSON.parse(telegram_chats);
                if (!Array.isArray(parsed)) {
                    return [];
                }
                return parsed;
            }
        }
        catch {
            return [];
        }
    });

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const telegram_messages = localStorage.getItem("telegram_messages");
            if (telegram_messages === null) {
                return [];
            }
            else {
                const parsed = JSON.parse(telegram_messages);
                if (!Array.isArray(parsed)) {
                    return [];
                }
                return parsed;
            }
        }
        catch {
            return [];
        }
    });
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [error, setError] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [chatId, setChatId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const activeChat = chats.find(chat => chat.chatId === chatId);

    const apiUrl = 'https://4100.api.green-api.com';
    useEffect(() => {
        if (!messagesContainerRef.current) return;
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }, [messages, chatId]);
    useEffect(() => {
        localStorage.setItem("telegram_chats", JSON.stringify(chats));
    }, [chats])
    useEffect(() => {
        localStorage.setItem("telegram_messages", JSON.stringify(messages));
    }, [messages]);
    async function handleConnect() {
        if (idInstance.trim() === '' || apiTokenInstance.trim() === '') {
            setError('Обязательные поля не заполнены');
            return;
        }
        try
        {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`)
            if (!response.ok) {
                setError('Ошибка подключения к серверу');
                return;
            }
            const data = await response.json()
            setError('');
            if (data.stateInstance === 'authorized') {
                setIsAuthorized(true);
                setError('');
            }
            else {
                setError('Ошибка авторизации');
            }
        }
        catch (error) {
            setError('Не удалось связаться с GREEN-API. Причина: ' + error);
        }
    }
    async function handleSearchUser() {
        setMessage("");
        try {
            if (phoneNumber.trim() === '') {
                setError('Номер телефона не заполнен');
                return;
            }
            if (!/^\d+$/.test(phoneNumber.trim()))
            {
                setError('Номер телефона указан неверно');
                return;
            }
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: Number(phoneNumber),
                })
            })
            if (!response.ok) {
                setError('Ошибка подключения к серверу');
                return;
            }
            const data = await response.json()
            setError('');
            if (data.exist === true) {
                setChatId(data.chatId);
                const newChat : Chat = {
                    chatId: data.chatId,
                    phoneNumber: phoneNumber,
                };
                setChats(prev => {
                    if (prev.some(chat =>
                        chat.chatId === newChat.chatId
                    )) return prev;
                    else
                        return [...prev, newChat]
                });
                setError('');
            }
            else {
                setError('Пользователь не найден или недоступен по номеру телефона');
            }
        }
        catch (error) {
            setError('Ошибка получения ID пользователя: ' + error);
        }
    }
    async function handleSendMessage() {
        if (message.trim() === '') {
            setError('Сообщение не может быть пустым')
            return;
        }
        if (chatId === null) {
            setError('ID чата пользователя не может быть пустым');
            return;
        }
        try {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: chatId,
                    message: message,
                })
            })
            if (!response.ok) {
                setError('Ошибка подключения к серверу');
                return;
            }
            const data = await response.json()
            if (typeof data.idMessage === "string" && data.idMessage.length > 0) {
                setMessage('');
                setError('');

                const newMessage : ChatMessage = {
                    id: data.idMessage,
                    chatId: chatId,
                    text: message,
                    direction: 'outgoing',
                };
                setMessages(prev => [...prev, newMessage]);
            }
            else {
                setError('Не удалось отправить сообщение');
            }
        }
        catch (error) {
            setError('Ошибка отправки сообщения: ' + error);
        }
    }


    useEffect(() => {
        if (!isAuthorized) return;
        const controller = new AbortController();
        console.log('Подключение установлено. Запускаем получение уведомлений');
        let stopped = false;
        let timer: number | undefined;
        async function deleteNotification(receiptId: number, signal: AbortSignal) {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`, {
                method: 'DELETE',
                signal: signal,
            })
            if (!response.ok) {
                throw new Error("Не удалось удалить уведомление");
            }
            const data = await response.json();
            if(data.result === true) {
                console.log('Уведомление удалено');
            }
            else {
                throw new Error("Не удалось удалить уведомление");
            }
        }
        async function receiveNotification(signal: AbortSignal) {
            try {
                const response = await fetch(`${apiUrl}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=5`, {
                    signal: signal,
                })
                if (!response.ok) {
                    setError('Ошибка подключения к серверу');
                    return;
                }
                const raw = await response.text();
                if (signal.aborted) return;
                if (raw.trim() === "") {
                    console.log("Уведомлений нет");
                    return;
                }
                const data = JSON.parse(raw);
                if (data === null) {
                    return;
                }
                if (typeof data.receiptId !== 'number') {
                    setError('Неизвестный тип уведомления');
                    return;
                }
                if(data) {
                    if (data.body?.typeWebhook === "incomingMessageReceived" && data.body?.messageData?.typeMessage === "textMessage") {
                        if (typeof data.body.idMessage === 'string' && typeof data.body.senderData.chatId === 'string' && typeof data.body.messageData.textMessageData.textMessage === 'string') {
                            const newMessage : ChatMessage = {
                                id: data.body.idMessage,
                                chatId: data.body.senderData.chatId,
                                text: data.body.messageData.textMessageData.textMessage,
                                direction: 'incoming',
                            };

                            setMessages(prev => {
                                if (prev.some(message =>
                                    message.id === newMessage.id &&
                                    message.chatId === newMessage.chatId
                                )) return prev;
                                else
                                    return [...prev, newMessage]
                            });
                        }
                        else {
                            setError('Не удалось получить сообщение');
                            return;
                        }
                    }
                    else {
                        console.log(data.body?.messageData?.typeMessage);
                    }
                    await deleteNotification(data.receiptId, signal);
                }

            }
            catch (error) {
                if (signal.aborted) return;
                setError('Ошибка получения сообщения: ' + error);
            }
        }
        async function check() {
            await receiveNotification(controller.signal);
            if (!stopped) {
                timer = setTimeout(check, 2000);
            }
        }
        check();
        return () => {
            stopped = true;
            console.log('Получение уведомлений остановлено');
            if (timer !== undefined) {
                clearTimeout(timer);
            }
            controller.abort();
        }
    }, [isAuthorized, idInstance, apiTokenInstance]);
  return (
    <>
        {!isAuthorized && (

            <div className="connecting-form min-h-screen bg-gray-100 py-10">

                  <div className="rounded-lg flex flex-col w-full max-w-2xl p-2 mx-auto bg-white">
                      <h1 className="text-3xl font-bold p-2">Telegram Chat</h1>
                      <span className="text-sm text-gray-600 p-2">Подключение к GREEN-API</span>
                      <label htmlFor="idInstance">idInstance</label>
                      <input
                          type="text"
                          id="idInstance"
                          className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                          placeholder="Введите idInstance"
                          onChange={(event)=>{setIdInstance(event.target.value)}}
                          value={idInstance}
                      />
                      <label htmlFor="apiTokenInstance">apiTokenInstance</label>
                      <input
                          type="password"
                          id="apiTokenInstance"
                          className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                          placeholder="Введите API-токен"
                          onChange={(event)=>{setApiTokenInstance(event.target.value)}}
                          value={apiTokenInstance}
                      />
                      <button
                          className="bg-blue-600 text-white p-2 rounded-lg"
                          onClick={handleConnect}
                      >
                          Подключиться
                      </button>
                      {error !== '' &&
                          <span className='text-red-500'>{error}</span>
                      }
                  </div>
            </div>
      )}




        {isAuthorized && (
            <div className='flex h-screen w-full bg-white overflow-hidden'>
                <aside className='w-80 shrink-0 border-r border-gray-200 bg-gray-50 p-4'>

                    <div className="flex flex-col gap-4">
                        <h1 className="text-xl font-semibold">Новый чат</h1>
                        <label htmlFor="phoneNumber" className="text-sm text-gray-600 p-2">Номер телефона</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                            placeholder="79991234567"
                            onChange={(event)=>{setPhoneNumber(event.target.value)}}
                            value={phoneNumber}
                        />
                        <button
                            className="bg-blue-600 text-white p-2 rounded-lg"
                            onClick={handleSearchUser}
                        >
                            Добавить чат
                        </button>
                        <h1 className='text-3xl font-bold p-2'>Мои чаты</h1>
                        <div>
                            {
                                chats.map(chat => (
                                    <button
                                        key={chat.chatId}
                                        onClick={() => {
                                            setChatId(chat.chatId)
                                            setMessage('');
                                        }
                                        }
                                        className={`w-full text-left p-3 rounded-lg ${
                                            chat.chatId === chatId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                                        }`}
                                    >{chat.phoneNumber}</button>
                                ))
                            }
                        </div>
                        {error !== '' &&
                            <span className='text-red-500'>{error}</span>
                        }
                    </div>
                </aside>
                <main className='flex-1 min-w-0 bg-white p-4 flex flex-col h-full'>
                    {chatId !== null && (
                            <div className="flex flex-col gap-4 h-full min-h-0">

                                <h1 className="text-2xl font-bold p-2">
                                    {activeChat?.phoneNumber ?? 'Активный чат не найден'}
                                </h1>

                                <div className='flex-1 min-h-0 overflow-y-auto' ref={messagesContainerRef}>
                                    <div className="min-h-full flex flex-col justify-end gap-2 py-3">
                                        {
                                            messages
                                                .filter(message => message.chatId === chatId)
                                                .map(message => (
                                                    <div className={`flex 
                                            ${
                                                        message.direction === 'outgoing'
                                                            ? 'justify-end'
                                                            : 'justify-start'
                                                    }
                                             
                                            `}
                                                         key={message.id}>
                                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 wrap-break-word
                                                    ${message.direction === 'outgoing'
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-100 text-gray-900'}
                                                `}>
                                                            {message.text}
                                                        </div>
                                                    </div>

                                                ))
                                        }
                                    </div>
                                </div>
                                <div className='flex items-end gap-3 shrink-0'>
                                <textarea
                                    id="message"
                                    className="flex-1 min-w-0 resize-none rounded-xl border border-gray-200 p-3"
                                    placeholder="Введите сообщение..."
                                    onChange={(event)=>{setMessage(event.target.value)}}
                                    value={message}
                                />
                                <button
                                    className="bg-blue-600 text-white p-2 rounded-lg shrink-0"
                                    onClick={handleSendMessage}
                                >
                                    Отправить
                                </button>
                                </div>
                                {error !== '' &&
                                    <span className='text-red-500'>{error}</span>
                                }
                            </div>
                        )
                    }
                    {chatId === null && (
                        <div className="flex h-full items-center justify-center">
                            <p className="text-lg text-gray-400">
                                Выберите чат, чтобы начать переписку
                            </p>
                        </div>
                    )}
                </main>
            </div>
        )}


    </>
  )
}