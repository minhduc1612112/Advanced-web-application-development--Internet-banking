# Back-end cho ứng dụng internet banking
## Cách cài đặt và khởi chạy
### Môi trường local (development)
1. npm install
2. npm run dev
### Môi trường production (Heroku)
1. npm install
2. npm start
### Môi trường production (Jenkins)
1. npm install pm2 -g
2. npm install
3. BUILD_ID=Internet_Banking_API pm2 restart internet_banking_api || BUILD_ID=Internet_Banking_API pm2 start 'npm run jenkins' --name internet_banking_api
## URL
### Môi trường production (Heroku): https://internet-banking-api-server.herokuapp.com
### Môi trường production (Jenkins): http://34.92.149.125:3000
