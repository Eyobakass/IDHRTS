import re

with open('idhrts_frontend/src/lib/api.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content += '''\napi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API ERROR RESPONSE URL:', error.config?.url);
    console.log('API ERROR RESPONSE STATUS:', error.response?.status);
    console.log('API ERROR RESPONSE DATA:', error.response?.data);
    return Promise.reject(error);
  }
);'''

with open('idhrts_frontend/src/lib/api.ts', 'w', encoding='utf-8') as f:
    f.write(content)
