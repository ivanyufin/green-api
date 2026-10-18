import {useState} from "react";

export default function App() {
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [error, setError] = useState("");
    async function handleConnect() {
        if (idInstance.trim() === '' || apiTokenInstance.trim() === '') {
            setError('Обязательные поля не заполнены');
            return;
        }
        try
        {
            const apiUrl = 'https://4100.api.green-api.com';
            const response = await fetch(`${apiUrl}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`)
            if (!response.ok) {
                setError('Ошибка подключения к серверу');
                return;
            }
            const data = await response.json()
            setError('');
            console.log(data.stateInstance);
        }
        catch (error) {
            setError('Не удалось связаться с GREEN-API. Причина: ' + error);
        }
    }
  return (
    <>
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
    </>
  )
}