import { toast as externalToast, ToastOptions } from 'react-hot-toast';

type ToastMessageType = 'success' | 'error' | 'loading';
type ToastOptionsCustom = ToastOptions;
type PromiseMessages = { loading: string; success: string; error: string };

function createHandler(type: ToastMessageType) {
	return (message: string) => externalToast[type](message);
}

const toast = {
	success: createHandler('success'),
	error: createHandler('error'),
	loading: createHandler('loading'),
	dismiss: (id?: string) => externalToast.dismiss(id),
	promise: <T>(
		promise: Promise<T>,
		messages: PromiseMessages,
		options: ToastOptionsCustom
	) => externalToast.promise(promise, messages, options),
};

export { toast };
