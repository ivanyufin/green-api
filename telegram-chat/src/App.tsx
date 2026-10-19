import {useState, useEffect} from "react";

export default function App() {
    type ChatMessage = {
        id: string;
        chatId: string;
        text: string;
        direction: 'incoming' | 'outgoing';
    };

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [error, setError] = useState("");
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [chatId, setChatId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    useEffect(() => {
        if (!isAuthorized) return;
        const controller = new AbortController();
        console.log('Подключение установлено. Запускаем получение уведомлений');
        let stopped = false;
        let timer: number | undefined;
        async function check() {
            await handleReceiveNotification(controller.signal);
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
    }, [isAuthorized]);
    const apiUrl = 'https://4100.api.green-api.com';
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
        setChatId(null);
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
    async function handleReceiveNotification(signal: AbortSignal) {
        try {
            setError('');
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
    async function deleteNotification(receiptId: number, signal: AbortSignal) {
        setError('');
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

  return (
    <>
      <div className="connecting-form min-h-screen bg-gray-100 py-10">
          {!isAuthorized && (

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
          )}


          {isAuthorized && (

              <div className="rounded-lg flex flex-col w-full max-w-2xl p-2 mx-auto bg-white my-10">
                  <h1 className="text-3xl font-bold p-2">Поиск пользователя Telegram</h1>
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
                      Найти пользователя
                  </button>
                  {chatId !== null && (
                      <span>ID чата пользователя: {chatId}</span>
                  )}
                  {error !== '' &&
                      <span className='text-red-500'>{error}</span>
                  }
              </div>
          )}
          {chatId !== null && (
              <div className="rounded-lg flex flex-col w-full max-w-2xl p-2 mx-auto bg-white my-10">
                  <h1 className="text-3xl font-bold p-2">Чат с пользователем</h1>

                  {
                      messages
                          .filter(message => message.chatId === chatId)
                          .map(message => (
                              <div className="bg-blue-100 p-3 rounded-lg my-2" key={message.id}>
                                  {message.text}
                              </div>
                          ))
                  }
                  <label htmlFor="message" className="text-sm text-gray-600">Сообщение</label>
                  <textarea
                      id="message"
                      className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                      placeholder="Введите сообщение..."
                      onChange={(event)=>{setMessage(event.target.value)}}
                      value={message}
                  />
                  <button
                      className="bg-blue-600 text-white p-2 rounded-lg"
                      onClick={handleSendMessage}
                  >
                      Отправить
                  </button>
                  {error !== '' &&
                      <span className='text-red-500'>{error}</span>
                  }
              </div>
          )

          }

      </div>



    </>
  )
}