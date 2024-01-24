# env-compose

compose your .env files

example

.env.local

```txt
VITE_API_LOCATION=localhost:3000
VITE_MONERIS_ENV=dev
```

.env.remote

```txt
VITE_API_LOCATION=myapiurl.com
VITE_MONERIS_ENV=prod
```

.env.remote-dev

```txt
VITE_MONERIS_ENV=$local.VITE_MONERIS_ENV
VITE_API_LOCATION=$remote.VITE_API_LOCATION
```

```bash
env-compose .env.remote-dev echo \$VITE_MONERIS_ENV
```
