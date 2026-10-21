type LoginFormProps = {
    idInstance: string,
    apiTokenInstance: string,
    apiUrl: string,
    error: string,
    isConnecting: boolean,
    onIdInstanceChange: (value: string) => void;
    onApiTokenChange: (value: string) => void;
    onApiUrlChange: (value: string) => void;
    onConnect: () => void;
}

export default function LoginForm(props: LoginFormProps) {
    return (

        <div className="connecting-form min-h-screen bg-gray-100 py-10">

            <div className="rounded-lg flex flex-col w-full max-w-2xl p-2 mx-auto bg-white">
                <h1 className="text-3xl font-bold p-2">Telegram Chat</h1>
                <span className="text-sm text-gray-600 p-2">Подключение к GREEN-API</span>
                <label htmlFor="apiUrl">apiUrl</label>
                <input
                    type="text"
                    id="apiUrl"
                    className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                    placeholder="Введите apiUrl"
                    onChange={(event)=>{props.onApiUrlChange(event.target.value)}}
                    value={props.apiUrl}
                />
                <label htmlFor="idInstance">idInstance</label>
                <input
                    type="text"
                    id="idInstance"
                    className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                    placeholder="Введите idInstance"
                    onChange={(event)=>{props.onIdInstanceChange(event.target.value)}}
                    value={props.idInstance}
                />
                <label htmlFor="apiTokenInstance">apiTokenInstance</label>
                <input
                    type="password"
                    id="apiTokenInstance"
                    className="bg-white rounded-3xl my-2 py-2 px-4 text-sm focus:outline-blue-500 border border-gray-100"
                    placeholder="Введите API-токен"
                    onChange={(event)=>{props.onApiTokenChange(event.target.value)}}
                    value={props.apiTokenInstance}
                />
                <button
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg p-3 w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={props.onConnect}
                    disabled={props.isConnecting}
                >
                    {props.isConnecting && (
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    )}
                    {props.isConnecting ? 'Подключение...' : 'Подключиться'}
                </button>
                {props.error !== '' &&
                    <span className='text-red-500'>{props.error}</span>
                }
            </div>
        </div>
    )
}