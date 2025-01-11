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

export {app}