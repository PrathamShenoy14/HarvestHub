import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true, limit:'16kb'}));
app.use(express.static('public'))
app.use(cookieParser());

import userRouter from './routes/user.route.js'

app.use('/api/users', userRouter)

import productRouter from './routes/product.route.js'

app.use('/api/products', productRouter)

import cartRouter from "./routes/cart.route.js";

app.use("/api/cart", cartRouter);

import wishlistRouter from "./routes/wishlist.route.js";

app.use("/api/wishlist", wishlistRouter);

import orderRouter from "./routes/order.route.js";

app.use("/api/orders", orderRouter);

import paymentRouter from "./routes/payment.route.js";
app.use("/api/payments", paymentRouter);

export {app}