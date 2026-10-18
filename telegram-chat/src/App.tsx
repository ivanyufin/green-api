import {useState} from "react";

export default function App() {
    const [idInstance, setIdInstance] = useState("");

  return (
    <>
      <div className="connecting-form min-h-screen">
        <div className="bg-gray-100 rounded-lg flex flex-col w-full max-w-2xl p-2 mx-auto my-10">
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
          <p>{idInstance}</p>
            <label htmlFor="apiTokenInstance">apiTokenInstance</label>
            <input
                type="password"
                id="apiTokenInstance"
                className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                placeholder="Введите API-токен"
            />
          <button className="bg-blue-600 text-white p-2 rounded-lg">Подключиться</button>
        </div>
      </div>
    </>
  )
}