type LoginFormProps = {
    idInstance: string,
    apiTokenInstance: string,
    error: string,
    onIdInstanceChange: (value: string) => void;
    onApiTokenChange: (value: string) => void;
    onConnect: () => void;
}

export default function LoginForm(props: LoginFormProps) {
    return (

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
                    className="bg-blue-600 text-white p-2 rounded-lg"
                    onClick={props.onConnect}
                >
                    Подключиться
                </button>
                {props.error !== '' &&
                    <span className='text-red-500'>{props.error}</span>
                }
            </div>
        </div>
    )
}