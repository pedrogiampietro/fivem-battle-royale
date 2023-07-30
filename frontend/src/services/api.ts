import axios from 'axios';

let isRefreshing = false;
let failedRequestQueue = [];

const limit = 20;

export function apiClient() {
	const api = axios.create({
		baseURL: 'http://localhost:5000/',
		transformResponse: [],
	});

	api.interceptors.request.use(
		(request: any) => {
			if (request.method?.toLowerCase() === 'get') {
				request.headers.limit = request.headers.limit ?? String(limit);
			}

			return request;
		},
		(error) => Promise.reject(error)
	);

	api.interceptors.response.use(
		(response) => {
			return response;
		},

		(error) => {
			// console.log('error:', error.response);

			//TODO

			return Promise.reject(error);
		}
	);

	return api;
}
