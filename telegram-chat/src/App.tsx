import {useState, useEffect} from "react";
import type {ChatMessage, Chat} from './types.ts';
import LoginForm from "./components/LoginForm";
import SideBar from "./components/Sidebar.tsx";
import ChatWindow from "./components/ChatWindow.tsx";

export default function App() {


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
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [chatId, setChatId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const activeChat = chats.find(chat => chat.chatId === chatId);

    //const apiUrl = 'https://4100.api.green-api.com';
    const [apiUrl, setApiURL] = useState<string>('');

    useEffect(() => {
        localStorage.setItem("telegram_chats", JSON.stringify(chats));
    }, [chats])
    useEffect(() => {
        localStorage.setItem("telegram_messages", JSON.stringify(messages));
    }, [messages]);
    async function handleConnect() {
        if (idInstance.trim() === '' || apiTokenInstance.trim() === '' || apiUrl.trim() === '') {
            setError('Обязательные поля не заполнены');
            return;
        }
        if (isConnecting) return;
        setIsConnecting(true);
        try
        {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`, {
                signal: AbortSignal.timeout(20000)
            })
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
        finally {
            setIsConnecting(false);
        }
    }
    async function handleSearchUser() {
        if (phoneNumber.trim() === '') {
            setError('Номер телефона не заполнен');
            return;
        }
        if (!/^\d+$/.test(phoneNumber.trim()))
        {
            setError('Номер телефона указан неверно');
            return;
        }
        if(isSearchingUser) return;
        setIsSearchingUser(true);
        try {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: Number(phoneNumber),
                }),
                signal: AbortSignal.timeout(20000),
            })
            if (!response.ok) {
                const details = await response.text();

                console.warn('checkAccount:', response.status, details);

                if (response.status === 469) {
                    setError('Telegram временно ограничил поиск контактов. Попробуйте позже.');
                } else if (response.status === 500) {
                    setError('Сервис Telegram временно недоступен. Попробуйте позже.');
                } else {
                    setError(`Не удалось проверить номер (HTTP ${response.status}).`);
                }

                return;
            }
            const data = await response.json();
            if (data.status === false) {
                const reason = data.data?.reason ?? data.reason;

                if (reason === 'rate_limit_exceeded') {
                    setError('Превышен лимит поиска пользователей. Попробуйте позже.');
                } else {
                    setError('Не удалось выполнить поиск пользователя.');
                }

                return;
            }
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
        finally {
            setIsSearchingUser(false);
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
        if (isSending) return;
        setIsSending(true);
        try {
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: chatId,
                    message: message,
                }),
                signal: AbortSignal.timeout(20000),
            })
            if (!response.ok) {
                const details = await response.text();

                console.warn('sendMessage:', response.status, details);

                if (response.status === 466) {
                    setError(
                        'Превышен лимит контактов GREEN-API. ' +
                        'На текущем тарифе переписка доступна только ' +
                        'с тремя разрешёнными собеседниками.'
                    );
                } else {
                    setError(
                        `Не удалось отправить сообщение (HTTP ${response.status}).`
                    );
                }

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
        finally {
            setIsSending(false);
        }
    }
    function handleSelectChat(selectedChatId: string) {
        setChatId(selectedChatId);
        setMessage('');
        setError('');
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
    }, [isAuthorized, idInstance, apiTokenInstance, apiUrl]);
  return (
    <>
        {!isAuthorized && (
            <LoginForm apiUrl={apiUrl} onApiUrlChange={setApiURL} idInstance={idInstance} onIdInstanceChange={setIdInstance} onApiTokenChange={setApiTokenInstance} error={error} apiTokenInstance={apiTokenInstance} onConnect={handleConnect} isConnecting={isConnecting}/>
      )}




        {isAuthorized && (
            <div className='flex h-screen w-full bg-white overflow-hidden'>
                <SideBar chats={chats} chatId={chatId} phoneNumber={phoneNumber} error={error} onPhoneNumberChange={setPhoneNumber} onSearchUser={handleSearchUser} onSelectChat={handleSelectChat} isSearchingUser={isSearchingUser} />
                <ChatWindow chatId={chatId} activeChat={activeChat} messages={messages} message={message} error={error} onMessageChange={setMessage} onSendMessage={handleSendMessage} isSending={isSending}/>

            </div>
        )}


    </>
  )
}