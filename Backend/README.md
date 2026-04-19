# Backend API Documentation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and configure:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn
```

3. Start server:
```bash
npm start
```

## PayOS Endpoints

- `POST /orders/checkout/payos`
  - Tạo đơn hàng + tạo link thanh toán PayOS.
  - Header: `Authorization: Bearer <token>`
  - Body:
  ```json
  {
    "shippingAddress": {
      "name": "Nguyen Van A",
      "phone": "0900000000",
      "address": "HCM"
    },
    "returnUrl": "http://localhost:5173/checkout/success",
    "cancelUrl": "http://localhost:5173/checkout",
    "description": "Thanh toan don hang"
  }
  ```

- `POST /orders/payos/webhook`
  - Webhook nhận callback từ PayOS.
  - Không cần token.

- `GET /orders/payos/:orderCode`
  - Đồng bộ trạng thái thanh toán từ PayOS theo `orderCode`.
  - Header: `Authorization: Bearer <token>`
